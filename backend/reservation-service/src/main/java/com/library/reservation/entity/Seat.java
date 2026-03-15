package com.library.reservation.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

@Data
@TableName("seat")
public class Seat {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long labId;
    private String seatNo;
    private String status; // FREE, MAINTENANCE
    private String maintenanceReason;
    private Date restoreTime;

    // Transient fields enriched at query time (not stored in DB)
    @TableField(exist = false)
    private String userAvatar;   // booker's avatar URL
    @TableField(exist = false)
    private Long bookerId;       // booker's userId
    @TableField(exist = false)
    private String bookerName;   // booker's display name
    @TableField(exist = false)
    private String bookerUserName;
    @TableField(exist = false)
    private String bookerAccount;
    @TableField(exist = false)
    private String bookStartTime;
    @TableField(exist = false)
    private String bookEndTime;
}
