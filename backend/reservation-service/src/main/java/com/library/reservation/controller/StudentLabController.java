package com.library.reservation.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.common.core.Result;
import com.library.reservation.entity.BookRecord;
import com.library.reservation.entity.Lab;
import com.library.reservation.entity.Seat;
import com.library.reservation.entity.User;
import com.library.reservation.feign.UserServiceClient;
import com.library.reservation.mapper.BookRecordMapper;
import com.library.reservation.mapper.LabMapper;
import com.library.reservation.mapper.SeatMapper;
import org.springframework.beans.factory.annotation.Autowired;
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
    private UserServiceClient userServiceClient;

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
    public Result<Map<String, Object>> getSeatsByLabId(
            @RequestParam("labId") Long labId,
            @RequestParam(value = "startTime", required = false) @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") java.util.Date startTime,
            @RequestParam(value = "endTime", required = false) @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") java.util.Date endTime
    ) {
        Lab lab = labMapper.selectById(labId);
        if (lab == null) {
            return Result.error("实验室不存在");
        }
        if ("UNAVAILABLE".equals(lab.getStatus())) {
            return Result.error("该实验室暂不可预约，请联系管理员");
        }

        List<Seat> seats = seatMapper.selectList(
                new LambdaQueryWrapper<Seat>().eq(Seat::getLabId, labId).orderByAsc(Seat::getSeatNo)
        );

        // Enrich seats by checking bookings that overlap with the selected time range
        for (Seat seat : seats) {
            LambdaQueryWrapper<BookRecord> recordWrapper = new LambdaQueryWrapper<BookRecord>()
                .eq(BookRecord::getSeatId, seat.getId())
                .in(BookRecord::getStatus, "PENDING", "CHECKED_IN");
            
            // If startTime/endTime are provided, filter for overlapping bookings
            if (startTime != null && endTime != null) {
                recordWrapper.and(w -> w
                    .le(BookRecord::getBookStartTime, endTime)
                    .ge(BookRecord::getBookEndTime, startTime)
                );
            }
            
            BookRecord record = bookRecordMapper.selectOne(
                    recordWrapper.orderByDesc(BookRecord::getCreateTime).last("LIMIT 1")
            );
            
            if (record != null && record.getUserId() != null) {
                seat.setStatus("BOOKED");
                seat.setBookerId(record.getUserId());
                
                try {
                    // Fetch user info from user-service
                    Result<User> userResult = userServiceClient.getUserById(record.getUserId());
                    if (userResult.getCode() == 200 && userResult.getData() != null) {
                        User user = userResult.getData();
                        // 1. Set Avatar
                        if (user.getAvatar() != null) {
                            seat.setUserAvatar(user.getAvatar());
                        }
                        
                        // 2. Set Names (Masked)
                        if (user.getName() != null && !user.getName().isEmpty()) {
                            seat.setBookerName(maskName(user.getName()));
                        } else {
                            seat.setBookerName("某同学");
                        }
                        
                        if (user.getUserName() != null) seat.setBookerUserName(user.getUserName());
                        
                        // 3. Set Account (Masked)
                        if (user.getAccount() != null) {
                            seat.setBookerAccount(maskAccount(user.getAccount()));
                        }
                    } else {
                        // Fallback if user details are not found in user-service
                        seat.setBookerName("神秘同学");
                    }
                } catch(Exception e) {
                    System.err.println("Feign error fetching user " + record.getUserId() + ": " + e.getMessage());
                    seat.setBookerName("神秘同学");
                }

                // Format times
                try {
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("HH:mm");
                    if (record.getBookStartTime() != null) seat.setBookStartTime(sdf.format(record.getBookStartTime()));
                    if (record.getBookEndTime() != null) seat.setBookEndTime(sdf.format(record.getBookEndTime()));
                } catch (Exception e) {}
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("labId", labId);
        data.put("labName", lab.getName());
        data.put("totalSeats", lab.getTotalSeats());
        data.put("cols", lab.getCols());
        data.put("layoutConfig", lab.getLayoutConfig());
        data.put("managerName", lab.getManagerName());
        data.put("managerEmail", lab.getManagerEmail());
        data.put("seats", seats);
        
        return Result.success(data);
    }
    
    private String maskName(String name) {
        if (name == null || name.isEmpty()) return "同学";
        if (name.length() == 1) return name + "同学";
        return name.substring(0, 1) + "同学";
    }
    
    private String maskAccount(String account) {
        if (account == null || account.length() < 6) return account;
        return account.substring(0, 4) + "******" + account.substring(account.length() - 2);
    }
}
