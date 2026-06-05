package com.library.reservation.entity;

import lombok.Data;
import java.io.Serializable;
import java.util.Date;

@Data
public class Notification implements Serializable {
    private Long id;
    private Long userId;
    private String title;
    private String content;
    private String type;
    private Boolean isRead;
    private Date createTime;
}
