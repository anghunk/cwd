# 常见问题

## 1. 为什么设置完 siteId 后，评论区不显示旧的评论数据？

因为设置了 siteId 后，接口会根据 siteId 来查询数据库带有你设置的 siteId 的评论数据。所以如果设置了 siteId，旧数据就有可能不显示，需要手动去 Cloudflare D1 控制台 Query 运行 SQL 语句来更新数据。

- `abc` 你要设置的 siteId
- `example.com` 查找包含指定域名的评论数据

```sql
UPDATE Comment
SET site_id = 'abc'
WHERE post_url LIKE '%example.com%';
```

运行以上 SQL 语句后，评论区就会显示带有 `abc` siteId 的评论数据了。

![](https://github.com/user-attachments/assets/ccfb31c9-8001-4174-b918-d3d8826c6617)
