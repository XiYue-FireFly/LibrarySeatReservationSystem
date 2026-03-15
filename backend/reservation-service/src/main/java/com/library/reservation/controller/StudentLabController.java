package com.library.reservation.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.common.core.Result;
import com.library.reservation.entity.BookRecord;
import com.library.reservation.entity.Lab;
import com.library.reservation.entity.Seat;
import com.library.reservation.mapper.BookRecordMapper;
import com.library.reservation.mapper.LabMapper;
import com.library.reservation.mapper.SeatMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class StudentLabController {

    @Autowired
    private LabMapper labMapper;
    
    @Autowired
    private SeatMapper seatMapper;

    @Autowired
    private BookRecordMapper bookRecordMapper;

    @Autowired
    private StringRedisTemplate redisTemplate;

    /**
     * 获取实验室列表（包括不可用的，前端展示维护中状态）
     */
    @GetMapping("/api/student/lab/list")
    public Result<List<Lab>> getLabList() {
        List<Lab> labs = labMapper.selectList(null); // Return all labs including UNAVAILABLE
        return Result.success(labs);
    }

    /**
     * 获取某实验室的所有座位，并为 BOOKED 座位附上预约人头像
     */
    @GetMapping("/api/student/seat/list")
    public Result<Map<String, Object>> getSeatsByLabId(@RequestParam("labId") Long labId) {
        Lab lab = labMapper.selectById(labId);
        if (lab == null) {
            return Result.error("实验室不存在");
        }
        if ("UNAVAILABLE".equals(lab.getStatus())) {
            return Result.error("该实验室暂不可预约，请联系管理员");
        }

        List<Seat> seats = seatMapper.selectList(
                new LambdaQueryWrapper<Seat>().eq(Seat::getLabId, labId).orderByAsc(Seat::getSeatNo) // Order by seatNo for consistent display
        );
        // Log seat numbers for debugging
        seats.forEach(seat -> System.out.println("Fetched Seat: " + seat.getSeatNo() + " (ID: " + seat.getId() + ")"));

        // Enrich BOOKED seats with the current booker's avatar from Redis
        for (Seat seat : seats) {
            if ("BOOKED".equals(seat.getStatus())) {
                // Find the active booking for this seat
                BookRecord record = bookRecordMapper.selectOne(
                        new LambdaQueryWrapper<BookRecord>()
                                .eq(BookRecord::getSeatId, seat.getId())
                                .in(BookRecord::getStatus, "PENDING", "CHECKED_IN")
                                .orderByDesc(BookRecord::getCreateTime)
                                .last("LIMIT 1")
                );
                if (record != null && record.getUserId() != null) {
                    seat.setBookerId(record.getUserId());
                    // Try to get avatar from Redis cache (set during login)
                    String avatar = redisTemplate.opsForValue().get("avatar:" + record.getUserId());
                    if (avatar != null) {
                        seat.setUserAvatar(avatar);
                    }
                    String name = redisTemplate.opsForValue().get("name:" + record.getUserId());
                    if (name != null) {
                        seat.setBookerName(name);
                    }
                    String username = redisTemplate.opsForValue().get("username:" + record.getUserId());
                    if (username != null) {
                        seat.setBookerUserName(username);
                    }
                    String account = redisTemplate.opsForValue().get("account:" + record.getUserId());
                    if (account != null) {
                        seat.setBookerAccount(account);
                    }
                    
                    try {
                        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("HH:mm");
                        if (record.getBookStartTime() != null) {
                            seat.setBookStartTime(sdf.format(record.getBookStartTime()));
                        }
                        if (record.getBookEndTime() != null) {
                            seat.setBookEndTime(sdf.format(record.getBookEndTime()));
                        }
                    } catch (Exception e) {
                        System.err.println("Time formatting error for seat " + seat.getId() + ": " + e.getMessage());
                    }
                }
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("labId", labId);
        data.put("labName", lab.getName());
        data.put("totalSeats", lab.getTotalSeats());
        data.put("cols", lab.getCols());
        data.put("layoutConfig", lab.getLayoutConfig());
        data.put("seats", seats);
        
        return Result.success(data);
    }
}
