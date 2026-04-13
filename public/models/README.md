# 徽章 3D 模型目录

将每枚徽章的 `.glb` 文件放置到此目录，文件名与 `badges.ts` 中的 `modelUrl` 字段对应。

## 命名规则

```
/public/models/<badge_id>.glb
```

例如：

| 徽章       | 文件名                          |
|------------|---------------------------------|
| 胡迪       | `badge_woody.glb`               |
| 巴斯光年   | `badge_buzz.glb`                |
| 三眼仔     | `badge_alien.glb`               |
| 毛怪       | `badge_sulley.glb`              |
| 尼莫       | `badge_nemo.glb`                |
| ...        | ...（共 43 枚，见 badges.ts）    |

## 完整文件列表

```
badge_woody.glb           badge_sulley.glb          badge_nemo.glb
badge_buzz.glb            badge_mike.glb            badge_marlin.glb
badge_three_eyes.glb      badge_boo.glb             badge_dory.glb
badge_forky.glb           badge_scare_door.glb      badge_gill.glb
badge_bo_peep.glb         badge_one_eye_symbol.glb  badge_crush.glb
badge_buzz_helmet.glb     badge_mu_emblem.glb       badge_whale_speak.glb
badge_andy_footprint.glb  badge_scream_canister.glb badge_coral_reef.glb
badge_rocket_ship.glb     badge_sulley_tail.glb
                                                    badge_mr_incredible.glb
                                                    badge_elastigirl.glb
badge_mcqueen.glb         badge_remy.glb            badge_violet.glb
badge_mater.glb           badge_linguini.glb        badge_dash.glb
badge_sally.glb           badge_chef_hat.glb        badge_jack_jack.glb
badge_doc_hudson.glb      badge_french_dish.glb     badge_incredibles_logo.glb
badge_piston_cup.glb      badge_eiffel_tower.glb    badge_frozone_symbol.glb
badge_95.glb                                        badge_super_car.glb
badge_radiator_springs.glb
```

## 注意事项

1. **无模型时自动降级**：若某个 `.glb` 文件不存在或加载失败，3D 预览界面会自动回退到程序生成的几何体（圆形/六边形/星形等），**不会报错或白屏**。
2. **文件格式**：推荐使用 `.glb`（二进制 GLTF），体积小、加载快。若需 Draco 压缩，需在 `Badge3DViewer` 中额外配置 `DRACOLoader`。
3. **模型尺寸**：加载后会自动缩放至约 2 个单位高度并居中，无需手动调整模型原始尺寸。
4. **贴图嵌入**：建议将贴图嵌入 GLB 文件（export with textures embedded），避免跨域加载问题。
