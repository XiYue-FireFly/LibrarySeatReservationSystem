package com.library.reservation.feign;

import com.library.common.core.Result;
import com.library.reservation.entity.User;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "${user-service.url:http://127.0.0.1:8081}")
public interface UserServiceClient {

    @GetMapping("/internal/user/{id}")
    Result<User> getUserById(@PathVariable("id") Long id);

    @GetMapping("/internal/user/account/{account}")
    Result<User> getUserByAccount(@PathVariable("account") String account);
}
