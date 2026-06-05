package com.library.reservation.task;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.reservation.entity.BookRecord;
import com.library.reservation.entity.Seat;
import com.library.reservation.feign.UserServiceClient;
import com.library.reservation.mapper.BookRecordMapper;
import com.library.reservation.mapper.SeatMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
public class ReservationTask {

    @Autowired
    private BookRecordMapper bookRecordMapper;

    @Autowired
    private SeatMapper seatMapper;

    @Autowired
    private UserServiceClient userServiceClient;

    /**
     * 每5分钟扫描一次逾期未签到的预约
     * 如果当前时间超过预约开始时间 15 分钟且处于 PENDING 状态，则判定为违纪
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void checkExpiredReservations() {
        Date now = new Date();
        // 15分钟宽限期
        Date expiredThreshold = new Date(now.getTime() - 15 * 60 * 1000);

        List<BookRecord> expiredRecords = bookRecordMapper.selectList(
                new LambdaQueryWrapper<BookRecord>()
                        .eq(BookRecord::getStatus, "PENDING")
                        .le(BookRecord::getBookStartTime, expiredThreshold)
        );

        for (BookRecord record : expiredRecords) {
            System.out.println("Processing expired reservation: " + record.getId() + " for user " + record.getUserId());
            
            // 1. 更新状态为 EXPIRED
            BookRecord upd = new BookRecord();
            upd.setId(record.getId());
            upd.setStatus("EXPIRED");
            bookRecordMapper.updateById(upd);

            // 2. 释放座位
            Seat seatUpd = new Seat();
            seatUpd.setId(record.getSeatId());
            seatUpd.setStatus("FREE");
            seatMapper.updateById(seatUpd);

            // 3. 记录违纪
            try {
                userServiceClient.reportViolation(record.getUserId());
            } catch (Exception e) {
                System.err.println("Failed to report violation for user " + record.getUserId() + ": " + e.getMessage());
            }
        }
    }
}
