package com.library.reservation.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

@Data
@TableName("feedback")
public class Feedback {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long bookId;
    private Long userId;
    private Long labId;
    private Long seatId;
    private String type;
    private String description;
    private String status; // PENDING, PROCESSING, RESOLVED
    private String adminReply;
    private Date createTime;
    private Date updateTime;
}
