INSERT INTO `lab` (`id`, `name`, `total_seats`, `status`) VALUES
(3, '电子技术实验室', 20, 'AVAILABLE'),
(4, '人工智能计算中心', 20, 'AVAILABLE'),
(5, '软件工程基地', 20, 'AVAILABLE'),
(6, '大模型计算区', 20, 'AVAILABLE')
ON DUPLICATE KEY UPDATE `name`=`name`;

INSERT IGNORE INTO `seat` (`lab_id`, `seat_no`, `status`) VALUES
(3, '01', 'FREE'), (3, '02', 'FREE'), (3, '03', 'FREE'), (3, '04', 'FREE'), (3, '05', 'FREE'),
(3, '06', 'FREE'), (3, '07', 'FREE'), (3, '08', 'FREE'), (3, '09', 'FREE'), (3, '10', 'FREE'),
(3, '11', 'FREE'), (3, '12', 'FREE'), (3, '13', 'FREE'), (3, '14', 'FREE'), (3, '15', 'FREE'),
(3, '16', 'FREE'), (3, '17', 'FREE'), (3, '18', 'FREE'), (3, '19', 'FREE'), (3, '20', 'FREE');

INSERT IGNORE INTO `seat` (`lab_id`, `seat_no`, `status`) VALUES
(4, '01', 'FREE'), (4, '02', 'FREE'), (4, '03', 'FREE'), (4, '04', 'FREE'), (4, '05', 'FREE'),
(4, '06', 'FREE'), (4, '07', 'FREE'), (4, '08', 'FREE'), (4, '09', 'FREE'), (4, '10', 'FREE'),
(4, '11', 'FREE'), (4, '12', 'FREE'), (4, '13', 'FREE'), (4, '14', 'FREE'), (4, '15', 'FREE'),
(4, '16', 'FREE'), (4, '17', 'FREE'), (4, '18', 'FREE'), (4, '19', 'FREE'), (4, '20', 'FREE');

INSERT IGNORE INTO `seat` (`lab_id`, `seat_no`, `status`) VALUES
(5, '01', 'FREE'), (5, '02', 'FREE'), (5, '03', 'FREE'), (5, '04', 'FREE'), (5, '05', 'FREE'),
(5, '06', 'FREE'), (5, '07', 'FREE'), (5, '08', 'FREE'), (5, '09', 'FREE'), (5, '10', 'FREE'),
(5, '11', 'FREE'), (5, '12', 'FREE'), (5, '13', 'FREE'), (5, '14', 'FREE'), (5, '15', 'FREE'),
(5, '16', 'FREE'), (5, '17', 'FREE'), (5, '18', 'FREE'), (5, '19', 'FREE'), (5, '20', 'FREE');

INSERT IGNORE INTO `seat` (`lab_id`, `seat_no`, `status`) VALUES
(6, '01', 'FREE'), (6, '02', 'FREE'), (6, '03', 'FREE'), (6, '04', 'FREE'), (6, '05', 'FREE'),
(6, '06', 'FREE'), (6, '07', 'FREE'), (6, '08', 'FREE'), (6, '09', 'FREE'), (6, '10', 'FREE'),
(6, '11', 'FREE'), (6, '12', 'FREE'), (6, '13', 'FREE'), (6, '14', 'FREE'), (6, '15', 'FREE'),
(6, '16', 'FREE'), (6, '17', 'FREE'), (6, '18', 'FREE'), (6, '19', 'FREE'), (6, '20', 'FREE');

UPDATE `seat` SET `status`='BOOKED' WHERE `lab_id`=3 AND `seat_no` IN ('05', '13');
UPDATE `seat` SET `status`='MAINTENANCE' WHERE `lab_id`=3 AND `seat_no` IN ('08');
UPDATE `seat` SET `status`='BOOKED' WHERE `lab_id`=4 AND `seat_no` IN ('02', '10', '19');
UPDATE `seat` SET `status`='IN_USE' WHERE `lab_id`=5 AND `seat_no` IN ('11', '20');
