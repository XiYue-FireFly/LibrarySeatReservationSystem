package com.library.user.controller;

import com.library.common.core.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.util.UUID;

@RestController
@RequestMapping("/api/common/upload")
public class UploadController {

    @Value("${file.upload-dir:uploads}") // Default to 'uploads' if not configured
    private String uploadBaseDir;

    /**
     * 上传头像接口
     * 返回可访问的 URL: /uploads/avatars/xxxx.png
     */
    @PostMapping("/avatar")
    public Result<String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Result.error("文件不能为空");
        }

        // 检查文件类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return Result.error("只允许上传图片文件");
        }

        // 获取项目根目录下的 uploads/avatars 文件夹
        String projectPath = System.getProperty("user.dir");
        String uploadDir = projectPath + File.separator + "uploads" + File.separator + "avatars";
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + extension;

        // 保存文件
        File dest = new File(uploadDir + File.separator + fileName);
        try {
            file.transferTo(dest);
            // 这里返回接口相对于网关/服务的访问路径，前端需要拼接基础路径
            // 假设前端本地开发时后端在 8081，可以直接通过 http://localhost:8081/uploads/avatars/xxx 访问
            // 但在生产或网关环境下，可能只是 /api/user/uploads/avatars/xxx 或直接 /uploads/avatars/xxx
            // 这里统一返回 /uploads/avatars/xxx
            return Result.success("/uploads/avatars/" + fileName);
        } catch (IOException e) {
            e.printStackTrace();
            return Result.error("文件保存失败: " + e.getMessage());
        }
    }

    /**
     * 通用图片上传接口
     * 根据 type 参数将文件保存到不同的子目录
     * 例如: /uploads/lab_images/xxxx.png 或 /uploads/avatars/xxxx.png
     */
    @PostMapping("/image")
    public Result<String> uploadImage(@RequestParam("file") MultipartFile file,
                                      @RequestParam(value = "type", defaultValue = "general") String type) {
        if (file.isEmpty()) {
            return Result.error("文件不能为空");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return Result.error("只允许上传图片文件");
        }

        // Use the configured base directory
        String subDir = type.replaceAll("[^a-zA-Z0-9_-]", ""); // Sanitize type for directory name
        String targetDir = uploadBaseDir + File.separator + subDir;
        Path dirPath = Paths.get(System.getProperty("user.dir"), targetDir);

        try {
            Files.createDirectories(dirPath); // Create directories if they don't exist
        } catch (IOException e) {
            e.printStackTrace();
            return Result.error("创建上传目录失败: " + e.getMessage());
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + extension;

        File dest = new File(dirPath.toFile(), fileName);
        try {
            file.transferTo(dest);
            // Return the relative URL
            return Result.success("/" + targetDir.replace(File.separator, "/") + "/" + fileName);
        } catch (IOException e) {
            e.printStackTrace();
            return Result.error("文件保存失败: " + e.getMessage());
        }
    }
}
