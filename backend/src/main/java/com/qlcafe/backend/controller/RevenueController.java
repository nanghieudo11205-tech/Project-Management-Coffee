package com.qlcafe.backend.controller;

import com.qlcafe.backend.dto.RevenueDTO;
import com.qlcafe.backend.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/revenue")
public class RevenueController {

    private final OrderRepository orderRepository;

    public RevenueController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<List<RevenueDTO>> getRevenueStats(@RequestParam(defaultValue = "day") String type) {
        if ("week".equalsIgnoreCase(type)) {
            return ResponseEntity.ok(aggregateWeeklyRevenue(orderRepository.findDailyRevenue()));
        }

        List<Object[]> rawData;
        switch (type.toLowerCase()) {
            case "month":
                rawData = orderRepository.findMonthlyRevenue();
                break;
            case "year":
                rawData = orderRepository.findYearlyRevenue();
                break;
            default:
                rawData = orderRepository.findDailyRevenue();
                break;
        }

        List<RevenueDTO> result = rawData.stream()
                .map(row -> new RevenueDTO(
                        row[0].toString(),
                        ((Number) row[1]).longValue(),
                        ((Number) row[2]).doubleValue()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    private List<RevenueDTO> aggregateWeeklyRevenue(List<Object[]> dailyRows) {
        Map<String, long[]> orderCounts = new LinkedHashMap<>();
        Map<String, Double> revenues = new LinkedHashMap<>();
        WeekFields weekFields = WeekFields.ISO;

        for (Object[] row : dailyRows) {
            LocalDate date = LocalDate.parse(row[0].toString());
            int weekYear = date.get(weekFields.weekBasedYear());
            int weekNum = date.get(weekFields.weekOfWeekBasedYear());
            String key = String.format("%d-W%02d", weekYear, weekNum);

            long count = ((Number) row[1]).longValue();
            double rev = ((Number) row[2]).doubleValue();

            orderCounts.computeIfAbsent(key, k -> new long[1])[0] += count;
            revenues.merge(key, rev, Double::sum);
        }

        List<RevenueDTO> result = new ArrayList<>();
        for (String key : orderCounts.keySet()) {
            result.add(new RevenueDTO(key, orderCounts.get(key)[0], revenues.get(key)));
        }
        return result;
    }
}
