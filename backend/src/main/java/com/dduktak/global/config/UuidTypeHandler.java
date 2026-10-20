package com.dduktak.global.config;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;
import org.springframework.stereotype.Component;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.UUID;

/**
 * MyBatis와 PostgreSQL 간 java.util.UUID 타입 자동 변환 TypeHandler
 */
@Component
@MappedTypes(UUID.class)
@MappedJdbcTypes(value = {JdbcType.OTHER, JdbcType.VARCHAR}, includeNullJdbcType = true)
public class UuidTypeHandler extends BaseTypeHandler<UUID> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, UUID parameter, JdbcType jdbcType) throws SQLException {
        ps.setObject(i, parameter, Types.OTHER);
    }

    @Override
    public UUID getNullableResult(ResultSet rs, String columnName) throws SQLException {
        Object val = rs.getObject(columnName);
        if (val == null) {
            return null;
        }
        if (val instanceof UUID uuid) {
            return uuid;
        }
        return UUID.fromString(val.toString());
    }

    @Override
    public UUID getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        Object val = rs.getObject(columnIndex);
        if (val == null) {
            return null;
        }
        if (val instanceof UUID uuid) {
            return uuid;
        }
        return UUID.fromString(val.toString());
    }

    @Override
    public UUID getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        Object val = cs.getObject(columnIndex);
        if (val == null) {
            return null;
        }
        if (val instanceof UUID uuid) {
            return uuid;
        }
        return UUID.fromString(val.toString());
    }
}
