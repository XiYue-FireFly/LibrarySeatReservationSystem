package com.library.common.exception;

import lombok.Getter;

/**
 * 自定义业务异常
 */
@Getter
public class ServiceException extends RuntimeException {
    private final Integer code;
    private final String message;

    public ServiceException(String message) {
        this(500, message);
    }

    public ServiceException(Integer code, String message) {
        super(message);
        this.code = code;
        this.message = message;
    }
}
