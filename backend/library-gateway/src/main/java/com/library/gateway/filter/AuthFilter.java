package com.library.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.common.core.Result;
import com.library.common.utils.JwtUtils;
import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * 全局JWT鉴权拦截器
 */
@Slf4j
@Component
public class AuthFilter implements GlobalFilter, Ordered {

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    // 白名单路径
    private final List<String> whiteList = Arrays.asList(
            "/api/common/login/**",
            "/api/common/check-account",
            "/api/common/register/admin",
            "/api/student/register",
            "/api/common/refresh-token"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 放行白名单
        for (String url : whiteList) {
            if (pathMatcher.match(url, path)) {
                return chain.filter(exchange);
            }
        }

        String token = getToken(request);
        if (StringUtils.hasText(token)) {
            try {
                Claims claims = JwtUtils.parseToken(token);
                // 鉴权 (示例：拦截非管理端调用 /api/admin)
                String role = claims.get("role", String.class);
                if (path.startsWith("/api/admin") && !("ADMIN".equals(role) || "SUPER_ADMIN".equals(role))) {
                    return unauthorizedResponse(exchange, "权限不足");
                }
                
                // 将用户ID透传给下游微服务
                ServerHttpRequest mutatedRequest = request.mutate()
                        .header("X-User-Id", claims.getSubject())
                        .header("X-User-Role", role)
                        .build();
                return chain.filter(exchange.mutate().request(mutatedRequest).build());

            } catch (Exception e) {
                log.warn("Token parse error: {}", e.getMessage());
                return unauthorizedResponse(exchange, "令牌已过期或无效，请重新登录");
            }
        }

        return unauthorizedResponse(exchange, "未获取到令牌信息，请重新登录");
    }

    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange, String msg) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Result<Object> result = Result.error(401, msg);
        ObjectMapper mapper = new ObjectMapper();
        DataBuffer buffer = null;
        try {
            buffer = response.bufferFactory().wrap(mapper.writeValueAsString(result).getBytes(StandardCharsets.UTF_8));
        } catch (JsonProcessingException e) {
            log.error("Error creating response", e);
        }

        return response.writeWith(Mono.just(buffer));
    }

    private String getToken(ServerHttpRequest request) {
        String token = request.getHeaders().getFirst("Authorization");
        if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
            return token.substring(7);
        }
        return null;
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
