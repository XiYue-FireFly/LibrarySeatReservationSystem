package com.library.reservation.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.library.common.core.Result;
import com.library.reservation.entity.Lab;
import com.library.reservation.entity.Seat;
import com.library.reservation.mapper.LabMapper;
import com.library.reservation.mapper.SeatMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/admin/seat")
public class AdminSeatController {

    @Autowired
    private SeatMapper seatMapper;

    @Autowired
    private LabMapper labMapper;

    /**
     * 单个座位状态修改（FREE / MAINTENANCE）
     */
    @PutMapping("/status")
    public Result<Void> updateSeatStatus(@RequestBody Map<String, Object> params) {
        Long seatId = Long.valueOf(params.get("seatId").toString());
        String status = params.get("status").toString();
        String reason = params.get("maintenanceReason") != null ? params.get("maintenanceReason").toString() : null;

        LambdaUpdateWrapper<Seat> uw = new LambdaUpdateWrapper<>();
        uw.eq(Seat::getId, seatId)
          .set(Seat::getStatus, status)
          .set(Seat::getMaintenanceReason, reason);
        seatMapper.update(null, uw);
        return Result.success();
    }

    /**
     * 批量设置座位状态（按 seatIds 列表）
     */
    @PutMapping("/status/batch")
    public Result<Void> batchUpdateStatus(@RequestBody Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<Integer> ids = (List<Integer>) params.get("seatIds");
        String status = params.get("status").toString();
        String reason = params.get("maintenanceReason") != null ? params.get("maintenanceReason").toString() : null;

        if (ids == null || ids.isEmpty()) return Result.error("请选择座位");

        LambdaUpdateWrapper<Seat> uw = new LambdaUpdateWrapper<>();
        uw.in(Seat::getId, ids)
          .set(Seat::getStatus, status)
          .set(Seat::getMaintenanceReason, reason);
        seatMapper.update(null, uw);
        return Result.success();
    }

    /**
     * 修改实验室座位总数（增加或减少）
     * 增加：自动追加新 Seat 行（seatNo 自动递增）
     * 减少：从末尾删除多余的 FREE 座位
     */
    @PutMapping("/resize")
    public Result<Void> resizeLab(@RequestBody Map<String, Object> params) {
        Long labId = Long.valueOf(params.get("labId").toString());
        int newTotal = Integer.parseInt(params.get("totalSeats").toString());

        if (newTotal < 1 || newTotal > 200) return Result.error("座位数须在 1-200 之间");

        Lab lab = labMapper.selectById(labId);
        if (lab == null) return Result.error("实验室不存在");

        List<Seat> existing = seatMapper.selectList(
            new LambdaQueryWrapper<Seat>().eq(Seat::getLabId, labId).orderByAsc(Seat::getId)
        );
        int current = existing.size();

        if (newTotal > current) {
            // Add seats
            int add = newTotal - current;
            for (int i = 1; i <= add; i++) {
                Seat s = new Seat();
                s.setLabId(labId);
                int num = current + i;
                char row = (char) ('A' + (num - 1) / 10);
                int col = (num - 1) % 10 + 1;
                s.setSeatNo(row + String.valueOf(col));
                s.setStatus("FREE");
                seatMapper.insert(s);
            }
        } else if (newTotal < current) {
            // Remove FREE seats from the end
            int toRemove = current - newTotal;
            int removed = 0;
            for (int i = existing.size() - 1; i >= 0 && removed < toRemove; i--) {
                Seat s = existing.get(i);
                if ("FREE".equals(s.getStatus())) {
                    seatMapper.deleteById(s.getId());
                    removed++;
                }
            }
            if (removed < toRemove) {
                return Result.error("部分座位正在使用中，只删除了 " + removed + " 个空闲座位");
            }
        }

        // Update lab totalSeats
        Lab upd = new Lab();
        upd.setId(labId);
        upd.setTotalSeats(newTotal);
        labMapper.updateById(upd);

        return Result.success();
    }

    /**
     * 获取实验室座位（含状态）
     */
    @GetMapping("/list")
    public Result<List<Seat>> getSeatList(@RequestParam Long labId) {
        return Result.success(seatMapper.selectList(
            new LambdaQueryWrapper<Seat>().eq(Seat::getLabId, labId).orderByAsc(Seat::getId)
        ));
    }

    /**
     * 单个座位改名（管理员自定义）
     */
    @PutMapping("/rename")
    public Result<Void> renameSeat(@RequestBody Map<String, Object> params) {
        Long seatId = Long.valueOf(params.get("seatId").toString());
        String newName = params.get("seatNo").toString().trim();
        if (newName.isEmpty()) return Result.error("座位名不能为空");

        LambdaUpdateWrapper<Seat> uw = new LambdaUpdateWrapper<>();
        uw.eq(Seat::getId, seatId).set(Seat::getSeatNo, newName);
        seatMapper.update(null, uw);
        return Result.success();
    }

    /**
     * 按行列规则批量重命名
     * 格式：{行号}{列字母} = 1A, 1B, 2A, 2B ...
     * columns = 每行座位数
     */
    @PostMapping("/rename-grid")
    public Result<Void> renameByGrid(@RequestBody Map<String, Object> params) {
        Long labId = Long.valueOf(params.get("labId").toString());
        int columns = Integer.parseInt(params.get("columns").toString());
        if (columns < 1) return Result.error("列数必须 ≥ 1");

        List<Seat> seats = seatMapper.selectList(
            new LambdaQueryWrapper<Seat>().eq(Seat::getLabId, labId).orderByAsc(Seat::getId)
        );

        for (int i = 0; i < seats.size(); i++) {
            int row = i / columns + 1;                   // 1, 2, 3...
            int col = i % columns;                        // 0, 1, 2... → A, B, C...
            String colLetter = String.valueOf((char)('A' + col));
            String newName = row + colLetter;             // e.g. "1A", "2C"

            Seat s = new Seat();
            s.setId(seats.get(i).getId());
            s.setSeatNo(newName);
            seatMapper.updateById(s);
        }
        return Result.success();
    }
}
