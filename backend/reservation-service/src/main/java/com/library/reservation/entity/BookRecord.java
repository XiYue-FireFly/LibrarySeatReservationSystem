package com.library.reservation.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

@Data
@TableName("book_record")
public class BookRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long labId;
    private Long seatId;
    private Date bookStartTime;
    private Date bookEndTime;
    private String status; // PENDING, CHECKED_IN, FINISHED, CANCELLED
    private String cancelReason;
    private Date createTime;
    private Date updateTime;
}
