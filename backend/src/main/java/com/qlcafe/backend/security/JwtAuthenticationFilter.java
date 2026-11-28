package com.qlcafe.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    public static final String JWT_ERROR_ATTRIBUTE = "jwt_error";

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;
    private final TokenBlacklistService tokenBlacklistService;

    public JwtAuthenticationFilter(
            JwtTokenProvider tokenProvider,
            CustomUserDetailsService customUserDetailsService,
            TokenBlacklistService tokenBlacklistService
    ) {
        this.tokenProvider = tokenProvider;
        this.customUserDetailsService = customUserDetailsService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String jwt = getJwtFromRequest(request);
        if (StringUtils.hasText(jwt)) {
            try {
                if (tokenBlacklistService.isBlacklisted(jwt)) {
                    request.setAttribute(JWT_ERROR_ATTRIBUTE, "Phiên đăng nhập đã kết thúc (token đã đăng xuất)");
                } else {
                    Claims claims = tokenProvider.parseClaims(jwt);
                    String username = claims.getSubject();
                    UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
                    if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
                        request.setAttribute(JWT_ERROR_ATTRIBUTE, "Tài khoản đã bị khóa hoặc ngừng hoạt động");
                    } else {
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            } catch (ExpiredJwtException ex) {
                request.setAttribute(JWT_ERROR_ATTRIBUTE, "Token đã hết hạn, vui lòng đăng nhập lại");
            } catch (JwtException | IllegalArgumentException ex) {
                request.setAttribute(JWT_ERROR_ATTRIBUTE, "Token xác thực không hợp lệ");
            } catch (Exception ex) {
                request.setAttribute(JWT_ERROR_ATTRIBUTE, "Không thể xác thực người dùng");
            }
        }
        filterChain.doFilter(request, response);
    }

    public static String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
