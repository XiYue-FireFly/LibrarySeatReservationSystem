package com.library.reservation.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.common.core.Result;
import com.library.reservation.entity.BookRecord;
import com.library.reservation.entity.Seat;
import com.library.reservation.mapper.BookRecordMapper;
import com.library.reservation.mapper.SeatMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
public class StudentBookController {

    @Autowired
    private BookRecordMapper bookRecordMapper;

    @Autowired
    private SeatMapper seatMapper;
    
    @Autowired
    private com.library.reservation.feign.UserServiceClient userServiceClient;

    /**
     * 获取个人的预约记录
     */
    @GetMapping("/api/student/book/my")
    public Result<List<BookRecord>> getMyBooks(@RequestHeader("X-User-Id") String userId) {
        List<BookRecord> records = bookRecordMapper.selectList(
                new LambdaQueryWrapper<BookRecord>()
                        .eq(BookRecord::getUserId, Long.parseLong(userId))
                        .orderByDesc(BookRecord::getCreateTime)
        );
        return Result.success(records);
    }

    /**
     * 创建预约 (支持单选与批量不超过3个)
     * 预约成功后将座位状态更新为 BOOKED
     */
    @PostMapping("/api/student/book/create")
    public Result<Void> createBook(@RequestHeader("X-User-Id") String userId, @RequestBody List<BookRecord> bookRecords) {
        if (bookRecords == null || bookRecords.isEmpty()) {
            return Result.error("预约参数为空");
        }
        if (bookRecords.size() > 3) {
            return Result.error("一次最多只能预约3个座位");
        }

        Long uid = Long.parseLong(userId);
        
        // Check if user is punished
        try {
            com.library.common.core.Result<com.library.reservation.entity.User> userRes = userServiceClient.getUserById(uid);
            if (userRes != null && userRes.getData() != null) {
                com.library.reservation.entity.User user = userRes.getData();
                if (Boolean.TRUE.equals(user.getPunishStatus())) {
                    Date now = new Date();
                    if (user.getPunishEndTime() != null && user.getPunishEndTime().after(now)) {
                        String dateStr = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(user.getPunishEndTime());
                        return Result.error("您的账号目前处于违纪封禁状态，预计解封时间：" + dateStr + "。如有疑问请联系管理员。");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to check user punishStatus: " + e.getMessage());
        }
        
        // Time restriction check: 08:00 - 20:00
        java.util.Calendar cal = java.util.Calendar.getInstance();
        for (BookRecord record : bookRecords) {
            if (record.getBookStartTime() == null || record.getBookEndTime() == null) {
                return Result.error("预约时间不能为空");
            }
            
            cal.setTime(record.getBookStartTime());
            int startHour = cal.get(java.util.Calendar.HOUR_OF_DAY);
            cal.setTime(record.getBookEndTime());
            int endHour = cal.get(java.util.Calendar.HOUR_OF_DAY);
            int endMinute = cal.get(java.util.Calendar.MINUTE);

            // 限制：8点之前或20点之后不能预约
            // 注意：20:00整是可以作为结束时间的，但不能超过20:00
            if (startHour < 8 || startHour >= 20) {
                return Result.error("预约起始时间必须在 08:00 - 20:00 之间");
            }
            if (endHour > 20 || (endHour == 20 && endMinute > 0)) {
                return Result.error("预约结束时间不能超过 20:00");
            }

            // 1. 检查座位是否已被预约（时间冲突）
            Long seatConflict = bookRecordMapper.selectCount(new LambdaQueryWrapper<BookRecord>()
                    .eq(BookRecord::getSeatId, record.getSeatId())
                    .in(BookRecord::getStatus, "PENDING", "CHECKED_IN")
                    .and(wrapper -> wrapper
                            .le(BookRecord::getBookStartTime, record.getBookEndTime())
                            .ge(BookRecord::getBookEndTime, record.getBookStartTime())
                    )
            );
            if (seatConflict > 0) {
                return Result.error("座位 " + record.getSeatId() + " 在所选时间段已被预约，请刷新后重试");
            }

            // 2. 检查用户是否已有同时间段预约冲突
            Long userConflict = bookRecordMapper.selectCount(new LambdaQueryWrapper<BookRecord>()
                    .eq(BookRecord::getUserId, uid)
                    .in(BookRecord::getStatus, "PENDING", "CHECKED_IN")
                    .and(wrapper -> wrapper
                            .le(BookRecord::getBookStartTime, record.getBookEndTime())
                            .ge(BookRecord::getBookEndTime, record.getBookStartTime())
                    )
            );
            if (userConflict > 0) {
                return Result.error("您在该时间段已有预约，请选择其他时间");
            }

            record.setUserId(uid);
            record.setStatus("PENDING");
            record.setCreateTime(new Date());
            record.setUpdateTime(new Date());
            bookRecordMapper.insert(record);

            // 3. 预约成功后更新座位状态为 BOOKED
            Seat seatUpdate = new Seat();
            seatUpdate.setId(record.getSeatId());
            seatUpdate.setStatus("BOOKED");
            seatMapper.updateById(seatUpdate);

            // 4. 发送预约成功通知
            try {
                com.library.reservation.entity.Notification notice = new com.library.reservation.entity.Notification();
                notice.setUserId(uid);
                notice.setTitle("🎉 预约成功通知");
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("MM-dd HH:mm");
                notice.setContent("您的座位预约已成功！座位号：" + record.getSeatId() + "，时段：" + 
                    sdf.format(record.getBookStartTime()) + " - " + sdf.format(record.getBookEndTime()) + 
                    "。请务必准时到达并签到。");
                notice.setType("SUCCESS");
                userServiceClient.sendNotification(notice);
            } catch (Exception e) {
                System.err.println("Failed to send booking notification: " + e.getMessage());
            }
        }

        return Result.success();
    }

    /**
     * 取消预约 (支持单个或批量取消)
     * 取消后将座位状态恢复为 FREE
     */
    @PostMapping("/api/student/book/cancel")
    public Result<Void> cancelBook(@RequestHeader("X-User-Id") String userId, @RequestBody List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Result.success();

        Long uid = Long.parseLong(userId);

        // 先查出要取消的预约记录，获取座位ID
        List<BookRecord> toCancel = bookRecordMapper.selectList(new LambdaQueryWrapper<BookRecord>()
                .in(BookRecord::getId, ids)
                .eq(BookRecord::getUserId, uid)
                .in(BookRecord::getStatus, "PENDING", "CHECKED_IN")
        );

        // 更新预约状态为已取消
        BookRecord updater = new BookRecord();
        updater.setStatus("CANCELLED");
        updater.setCancelReason("用户自主取消");
        bookRecordMapper.update(updater, new LambdaQueryWrapper<BookRecord>()
                .in(BookRecord::getId, ids)
                .eq(BookRecord::getUserId, uid)
        );

        // 释放座位，恢复为 FREE
        for (BookRecord record : toCancel) {
            if (record.getSeatId() != null) {
                // 检查该座位是否还有其他有效预约
                Long otherBookings = bookRecordMapper.selectCount(new LambdaQueryWrapper<BookRecord>()
                        .eq(BookRecord::getSeatId, record.getSeatId())
                        .in(BookRecord::getStatus, "PENDING", "CHECKED_IN")
                        .ne(BookRecord::getId, record.getId())
                );
                if (otherBookings == 0) {
                    Seat seatUpdate = new Seat();
                    seatUpdate.setId(record.getSeatId());
                    seatUpdate.setStatus("FREE");
                    seatMapper.updateById(seatUpdate);
                }
            }
        }

        return Result.success();
    }
}
