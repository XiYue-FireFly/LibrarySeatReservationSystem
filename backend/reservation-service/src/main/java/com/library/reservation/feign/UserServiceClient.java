package com.library.reservation.feign;

import com.library.common.core.Result;
import com.library.reservation.entity.User;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/internal/user/{id}")
    Result<Map<String, Object>> getUserById(@PathVariable("id") Long id);

    @GetMapping("/internal/user/account/{account}")
    Result<User> getUserByAccount(@PathVariable("account") String account);
}
