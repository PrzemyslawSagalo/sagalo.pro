---
title: SQL & Relational Databases
description: "Relational database operations, PostgreSQL queries, index tuning, and schema inspection cheat sheet."
sidebar:
  order: 6
tags:
  - sql
  - postgresql
  - databases
  - performance
---

Quick visual reference for relational database queries, join behaviors, set operations, and query structures.

## SQL Relational Operations

![SQL Visual Cheat Sheet](/images/sql.jpeg)

---

## Core SQL Patterns

### Joins Summary

- **INNER JOIN**: Returns records that have matching values in both tables.
- **LEFT (OUTER) JOIN**: Returns all records from the left table, and matched records from the right table.
- **RIGHT (OUTER) JOIN**: Returns all records from the right table, and matched records from the left table.
- **FULL (OUTER) JOIN**: Returns all records when there is a match in either left or right table.
- **CROSS JOIN**: Produces the Cartesian product of rows from both tables.

### Aggregation & Filtering
Remember the standard SQL clause evaluation order:
1. `FROM` & `JOIN`
2. `WHERE` (row-level filtering before grouping)
3. `GROUP BY` (aggregations)
4. `HAVING` (group-level filtering after aggregations)
5. `SELECT` (projections and expressions)
6. `DISTINCT`
7. `ORDER BY`
8. `LIMIT` / `OFFSET`
