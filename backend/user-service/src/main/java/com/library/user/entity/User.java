package com.library.user.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
@TableName("user")
public class User implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;
    private String account;
    private String password;
    private String name;
    private String userName;
    private String avatar;
    private String role;
    private Boolean punishStatus;
    private Integer bookAheadDays;
    private Date createTime;
    private Date updateTime;
}
