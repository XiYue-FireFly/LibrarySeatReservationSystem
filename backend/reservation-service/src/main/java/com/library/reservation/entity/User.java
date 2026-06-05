package com.library.reservation.entity;

import lombok.Data;

@Data
public class User {
    private Long id;
    private String account;
    private String name;
    private String userName;
    private String avatar;
    private Integer violationCount;
    private Boolean punishStatus;
    private java.util.Date punishEndTime;
    private String role;
}
