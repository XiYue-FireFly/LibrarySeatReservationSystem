package com.library.reservation.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.library.common.core.Result;
import com.library.reservation.entity.Feedback;
import com.library.reservation.mapper.FeedbackMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/feedback")
public class AdminFeedbackController {

    @Autowired
    private FeedbackMapper feedbackMapper;

    @GetMapping("/page")
    public Result<Map<String, Object>> getFeedbackPage(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String status) {
            
        LambdaQueryWrapper<Feedback> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(status)) {
            wrapper.eq(Feedback::getStatus, status);
        }
        wrapper.orderByAsc(Feedback::getStatus).orderByDesc(Feedback::getCreateTime);

        Page<Feedback> page = feedbackMapper.selectPage(new Page<>(current, size), wrapper);
        
        Map<String, Object> data = new HashMap<>();
        data.put("total", page.getTotal());
        data.put("records", page.getRecords());
        return Result.success(data);
    }
    
    @PutMapping("/reply")
    public Result<Void> replyFeedback(@RequestBody Feedback feedback) {
        if (feedback.getId() == null) return Result.error("ID为空");
        Feedback updater = new Feedback();
        updater.setId(feedback.getId());
        updater.setStatus(feedback.getStatus());
        updater.setAdminReply(feedback.getAdminReply());
        feedbackMapper.updateById(updater);
        return Result.success();
    }
}
