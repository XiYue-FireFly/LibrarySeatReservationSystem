package com.library.reservation.entity;

import lombok.Data;

@Data
public class User {
    private Long id;
    private String account;
    private String name;
    private String userName;
    private String avatar;
    private String role;
}
