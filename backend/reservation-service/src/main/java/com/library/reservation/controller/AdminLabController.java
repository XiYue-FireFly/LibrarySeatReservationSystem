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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/lab")
public class AdminLabController {

    @Autowired
    private LabMapper labMapper;

    @Autowired
    private BookRecordMapper bookRecordMapper;

    @Autowired
    private SeatMapper seatMapper;

    @Autowired
    private com.library.reservation.feign.UserServiceClient userServiceClient;

    /** 获取全部实验室 */
    @GetMapping("/list")
    public Result<List<Lab>> getAllLabs() {
        return Result.success(labMapper.selectList(null));
    }

    /** 更新实验室状态（上线/下线） */
    @PutMapping("/status")
    public Result<Void> updateLabStatus(@RequestBody Lab lab) {
        if (lab.getId() == null)
            return Result.error("ID不能为空");
        Lab updater = new Lab();
        updater.setId(lab.getId());
        updater.setStatus(lab.getStatus());
        updater.setOfflineReason(lab.getOfflineReason());
        labMapper.updateById(updater);
        return Result.success();
    }

    /**
     * 下线实验室：取消该实验室所有待签到预约，并释放对应座位
     */
    @PostMapping("/offline")
    public Result<Void> offlineLab(@RequestBody Lab lab) {
        if (lab.getId() == null)
            return Result.error("实验室ID不能为空");

        // 1. 标记实验室为不可预约
        Lab updater = new Lab();
        updater.setId(lab.getId());
        updater.setStatus("UNAVAILABLE");
        updater.setOfflineReason(lab.getOfflineReason() != null ? lab.getOfflineReason() : "管理员下线");
        labMapper.updateById(updater);

        // 2. 查找该实验室所有 PENDING 预约
        List<BookRecord> pendingBooks = bookRecordMapper.selectList(
                new LambdaQueryWrapper<BookRecord>()
                        .eq(BookRecord::getLabId, lab.getId())
                        .in(BookRecord::getStatus, "PENDING", "CHECKED_IN"));

        // 3. 批量取消预约
        if (!pendingBooks.isEmpty()) {
            BookRecord cancelUpd = new BookRecord();
            cancelUpd.setStatus("CANCELLED");
            cancelUpd.setCancelReason("实验室下线：" + updater.getOfflineReason());
            bookRecordMapper.update(cancelUpd, new LambdaQueryWrapper<BookRecord>()
                    .eq(BookRecord::getLabId, lab.getId())
                    .in(BookRecord::getStatus, "PENDING", "CHECKED_IN"));

            // 4. 释放座位
            Seat seatUpd = new Seat();
            seatUpd.setStatus("FREE");
            seatMapper.update(seatUpd, new LambdaQueryWrapper<Seat>()
                    .eq(Seat::getLabId, lab.getId())
                    .eq(Seat::getStatus, "BOOKED"));

            // 5. 发送通知给受影响的用户
            for (BookRecord record : pendingBooks) {
                try {
                    com.library.reservation.entity.Notification notice = new com.library.reservation.entity.Notification();
                    notice.setUserId(record.getUserId());
                    notice.setTitle("⚠️ 预约取消通知 (实验室下线)");
                    notice.setContent("非常抱歉，由于您预约的实验室「" + lab.getId() + "」因「" +
                            updater.getOfflineReason() + "」下线维护，您的预约 (ID: " + record.getId() + ") 已被取消。请重新选择其他实验室。");
                    notice.setType("WARNING");
                    userServiceClient.sendNotification(notice);
                } catch (Exception e) {
                    System.err.println("Failed to send offline notification: " + e.getMessage());
                }
            }
        }

        return Result.success();
    }

    /** 上线实验室 */
    @PostMapping("/online")
    public Result<Void> onlineLab(@RequestBody Lab lab) {
        if (lab.getId() == null)
            return Result.error("实验室ID不能为空");
        Lab updater = new Lab();
        updater.setId(lab.getId());
        updater.setStatus("AVAILABLE");
        updater.setOfflineReason(null);
        labMapper.updateById(updater);
        return Result.success();
    }

    /** 更新实验室布局配置 */
    @PutMapping("/layout")
    public Result<Void> updateLayout(@RequestBody Lab lab) {
        if (lab.getId() == null)
            return Result.error("实验室ID不能为空");
        Lab updater = new Lab();
        updater.setId(lab.getId());
        updater.setCols(lab.getCols());
        updater.setLayoutConfig(lab.getLayoutConfig());
        labMapper.updateById(updater);
        return Result.success();
    }

    /** 更新实验室图片 */
    @PutMapping("/image")
    public Result<Void> updateLabImage(@RequestBody Lab lab) {
        if (lab.getId() == null)
            return Result.error("实验室ID不能为空");
        Lab updater = new Lab();
        updater.setId(lab.getId());
        updater.setLabImageUrl(lab.getLabImageUrl());
        labMapper.updateById(updater);
        return Result.success();
    }

    /** 更新实验室负责人信息 */
    @PutMapping("/manager")
    public Result<Void> updateLabManager(@RequestBody Lab lab) {
        if (lab.getId() == null)
            return Result.error("实验室ID不能为空");
        Lab updater = new Lab();
        updater.setId(lab.getId());
        updater.setManagerName(lab.getManagerName());
        updater.setManagerEmail(lab.getManagerEmail());
        labMapper.updateById(updater);
        return Result.success();
    }
}
