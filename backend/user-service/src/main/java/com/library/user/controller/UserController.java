package com.library.user.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.common.core.Result;
import com.library.common.utils.JwtUtils;
import com.library.user.entity.User;
import com.library.user.entity.Notification;
import com.library.user.mapper.UserMapper;
import com.library.user.mapper.NotificationMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
public class UserController {

    @Autowired
    private UserMapper userMapper;

    // Use a simple in-memory map to track login failures
    private Map<String, Integer> loginFailures = new HashMap<>();

    /**
     * 学生登录
     */
    @PostMapping("/api/common/login/student")
    public Result<Map<String, Object>> studentLogin(@RequestBody Map<String, String> params) {
        return login(params.get("account"), params.get("password"), "STUDENT");
    }

    /**
     * 管理员登录
     */
    @PostMapping("/api/common/login/admin")
    public Result<Map<String, Object>> adminLogin(@RequestBody Map<String, String> params) {
        return login(params.get("account"), params.get("password"), "ADMIN");
    }

    private Result<Map<String, Object>> login(String account, String password, String expectedRolePrefix) {
        if (account == null || password == null) {
            return Result.error("账号或密码不能为空");
        }
        
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getAccount, account));
        if (user == null) {
            return Result.error("账号不存在");
        }

        // MD5 password check
        String md5Password = DigestUtils.md5DigestAsHex(password.getBytes());
        if (!user.getPassword().equals(md5Password)) {
            int fails = loginFailures.getOrDefault(account, 0) + 1;
            loginFailures.put(account, fails);
            if (fails >= 5) {
                return Result.error("密码错误次数过多，账号已锁定");
            }
            long remaining = 5 - fails;
            return Result.error("密码错误，还有 " + remaining + " 次机会");
        }

        // Clear failure counter on success
        loginFailures.remove(account);

        if ("STUDENT".equals(expectedRolePrefix)) {
            // Allow Student login path for Admins/SuperAdmins as well (for mobile app compatibility)
            if (!"STUDENT".equals(user.getRole()) && !"ADMIN".equals(user.getRole()) && !"SUPER_ADMIN".equals(user.getRole())) {
                return Result.error("非法角色登录");
            }
        }
        
        if ("ADMIN".equals(expectedRolePrefix) && "STUDENT".equals(user.getRole())) {
            return Result.error("权限不足，无法登录管理端");
        }

        // Generate Token
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole());
        claims.put("name", user.getName());
        String token = JwtUtils.createToken(claims, user.getId().toString());

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        // Do not return raw password
        user.setPassword(null);
        data.put("userInfo", user);
        return Result.success(data);
    }

    private String maskName(String name) {
        if (name == null || name.isEmpty()) return "*";
        if (name.length() == 1) return name;
        // Keep first char (surname in Chinese), replace rest with *
        return name.substring(0, 1) + "*";
    }
    
    /**
     * 账号检查
     */
    @GetMapping("/api/common/check-account")
    public Result<Map<String, Boolean>> checkAccount(@RequestParam String account, @RequestParam String type) {
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getAccount, account));
        Map<String, Boolean> res = new HashMap<>();
        res.put("isExist", count > 0);
        return Result.success(res);
    }

    /**
     * 学生注册
     */
    @PostMapping("/api/student/register")
    public Result<Void> studentRegister(@RequestBody User userForm) {
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getAccount, userForm.getAccount()));
        if (count > 0) return Result.error("该学号已被注册");
        
        userForm.setRole("STUDENT");
        userForm.setPassword(DigestUtils.md5DigestAsHex(userForm.getPassword().getBytes()));
        
        // Handle default avatar
        if (userForm.getAvatar() == null || userForm.getAvatar().trim().isEmpty()) {
            userForm.setAvatar("https://api.dicebear.com/7.x/avataaars/svg?seed=" + userForm.getAccount());
        }
        
        userMapper.insert(userForm);
        return Result.success();
    }

    /**
     * 管理员注册
     */
    @PostMapping("/api/common/register/admin")
    public Result<Void> adminRegister(@RequestBody User userForm) {
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getAccount, userForm.getAccount()));
        if (count > 0) return Result.error("该工号已被注册");
        
        userForm.setRole("ADMIN");
        userForm.setPassword(DigestUtils.md5DigestAsHex(userForm.getPassword().getBytes()));
        
        // Handle default avatar
        if (userForm.getAvatar() == null || userForm.getAvatar().trim().isEmpty()) {
            userForm.setAvatar("https://api.dicebear.com/7.x/avataaars/svg?seed=" + userForm.getAccount());
        }
        
        userMapper.insert(userForm);
        return Result.success();
    }

    /**
     * 获取个人完整信息 (学生端刷新)
     */
    @GetMapping("/api/student/user/info")
    public Result<User> getStudentInfo(@RequestHeader("X-User-Id") String userId) {
        User user = userMapper.selectById(Long.parseLong(userId));
        if (user != null) user.setPassword(null);
        return Result.success(user);
    }

    /**
     * 修改个人信息 (用户名与头像)
     */
    @PutMapping("/api/student/user/info/update")
    public Result<Void> updateUserInfo(@RequestHeader("X-User-Id") String userIdStr, @RequestBody User userForm) {
        Long userId = Long.parseLong(userIdStr);
        User oldUser = userMapper.selectById(userId);
        if (oldUser == null) return Result.error("用户不存在");

        // 1. Handle Avatar Update & Cleanup
        if (userForm.getAvatar() != null && !userForm.getAvatar().equals(oldUser.getAvatar())) {
            String oldAvatar = oldUser.getAvatar();
            // If old avatar was a local file, delete it
            if (oldAvatar != null && oldAvatar.contains("/uploads/avatars/")) {
                try {
                    String projectPath = System.getProperty("user.dir");
                    // Extract filename: /uploads/avatars/uuid.png -> uuid.png
                    String fileName = oldAvatar.substring(oldAvatar.lastIndexOf("/") + 1);
                    File file = new File(projectPath + File.separator + "uploads" + File.separator + "avatars" + File.separator + fileName);
                    if (file.exists()) {
                        file.delete();
                    }
                } catch (Exception e) {
                    System.err.println("Failed to delete old avatar: " + e.getMessage());
                }
            }
        }

        // 2. Update Database
        User updater = new User();
        updater.setId(userId);
        if (userForm.getUserName() != null) updater.setUserName(userForm.getUserName());
        if (userForm.getAvatar() != null) updater.setAvatar(userForm.getAvatar());
        userMapper.updateById(updater);
        return Result.success();
    }

    /**
     * 内部接口: 根据ID获取用户信息 (供 Reservation 服务通过 OpenFeign 调用)
     */
    @GetMapping("/internal/user/{id}")
    public Result<User> getUserById(@PathVariable("id") Long id) {
        User user = userMapper.selectById(id);
        return Result.success(user);
    }

    /**
     * 内部接口: 根据 account 获取用户信息
     */
    @GetMapping("/internal/user/account/{account}")
    public Result<User> getUserByAccount(@PathVariable("account") String account) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getAccount, account));
        return Result.success(user);
    }

    @Autowired
    private NotificationMapper notificationMapper;

    /**
     * 内部接口: 记录一次违纪
     */
    @PutMapping("/internal/user/violation/{id}")
    public Result<Void> reportViolation(@PathVariable("id") Long id) {
        User user = userMapper.selectById(id);
        if (user == null) return Result.error("用户不存在");

        User updater = new User();
        updater.setId(id);
        int newCount = (user.getViolationCount() == null ? 0 : user.getViolationCount()) + 1;
        updater.setViolationCount(newCount);
        
        long fifteenDaysMs = 15L * 24 * 3600 * 1000;
        Date now = new Date();
        
        // 达到3次或3的倍数进行封禁/延长封禁
        if (newCount >= 3) {
            updater.setPunishStatus(true);
            Date currentEnd = user.getPunishEndTime();
            Date newEnd;
            if (currentEnd != null && currentEnd.after(now)) {
                // 累加封禁
                newEnd = new Date(currentEnd.getTime() + fifteenDaysMs);
            } else {
                // 新增封禁
                newEnd = new Date(now.getTime() + fifteenDaysMs);
            }
            updater.setPunishEndTime(newEnd);
            
            // 发送通知
            Notification notice = new Notification();
            notice.setUserId(id);
            notice.setTitle("🚨 违纪封禁通知");
            notice.setContent("由于您的预约违纪次数已达到 " + newCount + " 次，系统已对您的账号执行封禁。封禁解除时间：" + 
                new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(newEnd) + "。请自觉遵守实验室规定。");
            notice.setType("ERROR");
            notice.setCreateTime(now);
            notificationMapper.insert(notice);
        } else {
            // 普通提醒
            Notification notice = new Notification();
            notice.setUserId(id);
            notice.setTitle("⚠️ 违纪预警");
            notice.setContent("您刚才有一笔预约因逾期未签到被系统记录违纪。当前累计违纪：" + newCount + 
                " 次。达到 3 次将面临 15 天封禁。");
            notice.setType("WARNING");
            notice.setCreateTime(now);
            notificationMapper.insert(notice);
        }
        
        userMapper.updateById(updater);
        return Result.success();
    }

    private String maskAccount(String account) {
        if (account == null || account.length() < 6) return account;
        // Keep first 4 and last 2 digits, use **** for middle
        // Example: 2409000047 -> 2409****47
        return account.substring(0, 4) + "****" + account.substring(account.length() - 2);
    }
}
