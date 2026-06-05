package com.library.user.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.library.common.core.Result;
import com.library.user.entity.Notification;
import com.library.user.mapper.NotificationMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
public class NotificationController {

    @Autowired
    private NotificationMapper notificationMapper;

    /**
     * 学生获取自己的通知列表
     */
    @GetMapping("/api/student/notification/my")
    public Result<List<Notification>> getMyNotifications(@RequestHeader("X-User-Id") String userId) {
        List<Notification> list = notificationMapper.selectList(
                new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getUserId, userId)
                        .orderByDesc(Notification::getCreateTime)
                        .last("LIMIT 50")
        );
        return Result.success(list);
    }

    /**
     * 标记某条通知为已读
     */
    @PutMapping("/api/student/notification/read/{id}")
    public Result<Void> markAsRead(@RequestHeader("X-User-Id") String userId, @PathVariable("id") Long id) {
        LambdaUpdateWrapper<Notification> uw = new LambdaUpdateWrapper<>();
        uw.eq(Notification::getId, id)
          .eq(Notification::getUserId, userId)
          .set(Notification::getIsRead, true);
        notificationMapper.update(null, uw);
        return Result.success();
    }

    /**
     * 内部接口：发送系统通知 (供其他微服务通过 Feign 调用)
     */
    @PostMapping("/internal/notification/send")
    public Result<Void> sendInternalNotification(@RequestBody Notification notification) {
        if (notification.getCreateTime() == null) {
            notification.setCreateTime(new Date());
        }
        notificationMapper.insert(notification);
        return Result.success();
    }
}
