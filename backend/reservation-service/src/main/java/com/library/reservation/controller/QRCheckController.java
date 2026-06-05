package com.library.reservation.controller;

import com.library.common.core.Result;
import com.library.reservation.entity.BookRecord;
import com.library.reservation.entity.Seat;
import com.library.reservation.mapper.BookRecordMapper;
import com.library.reservation.mapper.SeatMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;
import java.util.UUID;

@RestController
public class QRCheckController {

    @Autowired
    private BookRecordMapper bookRecordMapper;

    @Autowired
    private SeatMapper seatMapper;

    /**
     * 管理员：为特定预约生成动态 Token
     */
    @GetMapping("/api/admin/book/qr-token")
    public Result<Map<String, String>> generateQRToken(@RequestParam Long id, @RequestParam String type) {
        BookRecord record = bookRecordMapper.selectById(id);
        if (record == null) return Result.error("预约记录不存在");

        // 校验状态是否匹配 (签到必须是 PENDING, 签退必须是 CHECKED_IN)
        if ("IN".equals(type) && !"PENDING".equals(record.getStatus())) {
            return Result.error("该状态无法生成签到码");
        }
        if ("OUT".equals(type) && !"CHECKED_IN".equals(record.getStatus())) {
            return Result.error("该状态无法生成签退码");
        }

        String token = UUID.randomUUID().toString().substring(0, 32);
        Date expiry = new Date(System.currentTimeMillis() + 5 * 60 * 1000); // 5分钟有效期

        BookRecord updater = new BookRecord();
        updater.setId(id);
        updater.setCheckinToken(token);
        updater.setTokenExpiry(expiry);
        bookRecordMapper.updateById(updater);

        return Result.success(Map.of("token", token, "bookingId", id.toString(), "type", type));
    }

    /**
     * 学生：提交扫码数据进行验证
     */
    @PostMapping("/api/student/book/qr-verify")
    public Result<Void> verifyQRToken(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, String> data) {
        
        Long bookingId = Long.parseLong(data.get("bookingId"));
        String token = data.get("token");
        String type = data.get("type");

        BookRecord record = bookRecordMapper.selectById(bookingId);
        if (record == null) return Result.error("预约记录不存在");

        // 核心安全校验
        if (!record.getUserId().toString().equals(userId)) {
            return Result.error("非法操作：该预约不属于您");
        }
        if (record.getCheckinToken() == null || !record.getCheckinToken().equals(token)) {
            return Result.error("二维码无效或已被使用");
        }
        if (record.getTokenExpiry() == null || record.getTokenExpiry().before(new Date())) {
            return Result.error("二维码已过期，请管理员刷新");
        }

        BookRecord updater = new BookRecord();
        updater.setId(bookingId);
        updater.setCheckinToken(null); // 使用后立即失效

        if ("IN".equals(type)) {
            updater.setStatus("CHECKED_IN");
            // 更新座位为使用中
            Seat seat = new Seat();
            seat.setId(record.getSeatId());
            seat.setStatus("IN_USE");
            seatMapper.updateById(seat);
        } else if ("OUT".equals(type)) {
            updater.setStatus("FINISHED");
            // 释放座位
            Seat seat = new Seat();
            seat.setId(record.getSeatId());
            seat.setStatus("FREE");
            seatMapper.updateById(seat);
        }

        bookRecordMapper.updateById(updater);
        return Result.success();
    }
}
