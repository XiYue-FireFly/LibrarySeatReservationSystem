package com.library.reservation.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.common.core.Result;
import com.library.reservation.entity.Feedback;
import com.library.reservation.mapper.FeedbackMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
public class StudentFeedbackController {

    @Autowired
    private FeedbackMapper feedbackMapper;

    @PostMapping("/api/student/feedback/submit")
    public Result<Void> submitFeedback(@RequestHeader("X-User-Id") String userId, @RequestBody Feedback feedback) {
        feedback.setUserId(Long.parseLong(userId));
        feedback.setStatus("PENDING");
        feedback.setCreateTime(new Date());
        feedback.setUpdateTime(new Date());
        feedbackMapper.insert(feedback);
        return Result.success();
    }

    @GetMapping("/api/student/feedback/my")
    public Result<List<Feedback>> getMyFeedback(@RequestHeader("X-User-Id") String userId) {
        List<Feedback> list = feedbackMapper.selectList(
                new LambdaQueryWrapper<Feedback>()
                        .eq(Feedback::getUserId, Long.parseLong(userId))
                        .orderByDesc(Feedback::getCreateTime)
        );
        return Result.success(list);
    }
}
