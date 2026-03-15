package com.library.reservation.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

@Data
@TableName("lab")
public class Lab {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String labImageUrl; // Added this line
    private String managerName;
    private String managerEmail;
    private Integer totalSeats;
    private String status; // AVAILABLE, UNAVAILABLE
    private String offlineReason;
    private Integer cols;
    private String layoutConfig;
    private Date createTime;
    private Date updateTime;
}
