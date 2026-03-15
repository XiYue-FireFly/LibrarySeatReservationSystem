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

        for (BookRecord record : bookRecords) {
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
