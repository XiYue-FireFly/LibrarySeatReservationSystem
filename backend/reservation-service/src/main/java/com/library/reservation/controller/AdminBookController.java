package com.library.reservation.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.library.common.core.Result;
import com.library.reservation.entity.BookRecord;
import com.library.reservation.entity.Lab;
import com.library.reservation.entity.Seat;
import com.library.reservation.feign.UserServiceClient;
import com.library.reservation.mapper.BookRecordMapper;
import com.library.reservation.mapper.LabMapper;
import com.library.reservation.mapper.SeatMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/book")
public class AdminBookController {

    @Autowired
    private BookRecordMapper bookRecordMapper;
    
    @Autowired
    private LabMapper labMapper;

    @Autowired
    private SeatMapper seatMapper;

    @Autowired
    private UserServiceClient userServiceClient;

    @GetMapping("/page")
    public Result<Map<String, Object>> getBookPage(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long labId,
            @RequestParam(required = false) String account,
            @RequestParam(required = false) String status) {

        LambdaQueryWrapper<BookRecord> wrapper = new LambdaQueryWrapper<>();
        if (labId != null) wrapper.eq(BookRecord::getLabId, labId);
        if (StringUtils.hasText(status)) wrapper.eq(BookRecord::getStatus, status);

        if (StringUtils.hasText(account)) {
            Result<com.library.reservation.entity.User> userResult = userServiceClient.getUserByAccount(account);
            if (userResult.getCode() == 200 && userResult.getData() != null) {
                wrapper.eq(BookRecord::getUserId, userResult.getData().getId());
            } else {
                // 如果找不到用户，直接返回空
                return Result.success(Map.of("total", 0, "records", List.of()));
            }
        }

        wrapper.orderByDesc(BookRecord::getCreateTime);
        
        Page<BookRecord> page = bookRecordMapper.selectPage(new Page<>(current, size), wrapper);
        
        Map<String, Object> data = new HashMap<>();
        data.put("total", page.getTotal());
        data.put("records", page.getRecords());
        
        return Result.success(data);
    }
    
    @PutMapping("/cancel/{id}")
    public Result<Void> forceCancel(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        BookRecord existing = bookRecordMapper.selectById(id);
        if (existing == null) return Result.error("预约不存在");
        
        String reason = (body != null && body.get("cancelReason") != null) 
            ? body.get("cancelReason") : "管理员强制取消";

        BookRecord record = new BookRecord();
        record.setId(id);
        record.setStatus("CANCELLED");
        record.setCancelReason(reason);
        bookRecordMapper.updateById(record);

        // Release the seat back to FREE
        if (existing.getSeatId() != null) {
            Seat seatUpd = new Seat();
            seatUpd.setId(existing.getSeatId());
            seatUpd.setStatus("FREE");
            seatMapper.updateById(seatUpd);
        }

        // Send notification to student
        try {
            com.library.reservation.entity.Notification notice = new com.library.reservation.entity.Notification();
            notice.setUserId(existing.getUserId());
            notice.setTitle("⚠️ 预约取消通知");
            notice.setContent("您的预约 (ID: " + id + ") 已由管理员取消。原因：" + reason);
            notice.setType("WARNING");
            userServiceClient.sendNotification(notice);
        } catch (Exception e) {
            System.err.println("Failed to send cancellation notification: " + e.getMessage());
        }

        return Result.success();
    }

    /**
     * 管理员辅助签到
     */
    @PutMapping("/checkin/{id}")
    public Result<Void> adminCheckin(@PathVariable Long id) {
        BookRecord record = bookRecordMapper.selectById(id);
        if (record == null) return Result.error("预约不存在");
        if (!"PENDING".equals(record.getStatus())) return Result.error("该预约状态无法签到");

        BookRecord upd = new BookRecord();
        upd.setId(id);
        upd.setStatus("CHECKED_IN");
        bookRecordMapper.updateById(upd);

        // Update seat status if needed (though already BOOKED, keep consistent)
        Seat seat = new Seat();
        seat.setId(record.getSeatId());
        seat.setStatus("IN_USE");
        seatMapper.updateById(seat);

        return Result.success();
    }

    /**
     * 管理员辅助签退（结束预约并释放座位）
     */
    @PutMapping("/checkout/{id}")
    public Result<Void> adminCheckout(@PathVariable Long id) {
        BookRecord record = bookRecordMapper.selectById(id);
        if (record == null) return Result.error("预约不存在");
        if (!"PENDING".equals(record.getStatus()) && !"CHECKED_IN".equals(record.getStatus())) {
            return Result.error("该预约状态无法签退");
        }

        BookRecord upd = new BookRecord();
        upd.setId(id);
        upd.setStatus("FINISHED");
        bookRecordMapper.updateById(upd);

        // Release the seat back to FREE
        if (record.getSeatId() != null) {
            Seat seatUpd = new Seat();
            seatUpd.setId(record.getSeatId());
            seatUpd.setStatus("FREE");
            seatMapper.updateById(seatUpd);
        }

        return Result.success();
    }
}
