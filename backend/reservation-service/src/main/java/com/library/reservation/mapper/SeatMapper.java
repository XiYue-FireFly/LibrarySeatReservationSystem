package com.library.reservation.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.reservation.entity.Seat;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SeatMapper extends BaseMapper<Seat> {}
