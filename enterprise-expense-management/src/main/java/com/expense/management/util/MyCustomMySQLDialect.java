package com.expense.management.util;

import org.hibernate.dialect.MySQLDialect;

public class MyCustomMySQLDialect extends MySQLDialect {
	@Override
    public String getTableTypeString() {
        return " ENGINE=MyISAM";
    }

}
