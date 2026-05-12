# Windows 彻底删除用户完整指南
 
> **适用系统**：Windows 10 / Windows 11  
> **权限要求**：所有操作均需以**管理员身份**运行 PowerShell  
> **操作前提**：确保目标用户已完全注销，未处于登录状态
 
---
 
## 操作流程总览
 
```
第一步：记录用户 SID
        ↓
第二步：检查并卸载用户独占软件
        ↓
第三步：删除用户账户
        ↓
第四步：删除用户配置文件目录
        ↓
第五步：清理 SID 孤儿
        ↓
第六步：全局验证
```
 
---
 
## 第一步：记录用户 SID（最先执行，删除账户前必做）
 
SID 是后续所有清理操作的依据，**必须在删除账户之前记录**。
 
```powershell
# 获取目标用户的 SID
$username = "devel"  # 替换为实际用户名
$sid = (Get-LocalUser -Name $username).SID.Value
Write-Host "用户 SID：$sid"
 
# 获取用户配置文件路径
$profilePath = (Get-WmiObject Win32_UserProfile |
    Where-Object { $_.SID -eq $sid }).LocalPath
Write-Host "配置文件路径：$profilePath"
```
 
> ⚠️ **将输出的 SID 值记录下来**，后续步骤均会用到。
 
---
 
## 第二步：检查并卸载用户独占软件
 
### 2.1 挂载用户注册表，查看用户级安装的软件
 
```powershell
# 挂载用户的 NTUSER.DAT（用户必须未登录）
reg load "HKU\target_user" "$profilePath\NTUSER.DAT"
 
# 查询该用户 HKCU 下独占安装的软件
Get-ItemProperty "Registry::HKU\target_user\Software\Microsoft\Windows\CurrentVersion\Uninstall\*" |
    Select-Object DisplayName, DisplayVersion, Publisher, InstallLocation |
    Where-Object { $_.DisplayName -ne $null } |
    Format-Table -AutoSize
 
# 查看用户级启动项
Get-ItemProperty "Registry::HKU\target_user\Software\Microsoft\Windows\CurrentVersion\Run"
 
# 查询完成后卸载挂载
reg unload "HKU\target_user"
```
 
### 2.2 对比系统级软件（全局安装，无需处理）
 
```powershell
# 查看系统级（所有用户）安装的软件，用于对比
Get-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
                 "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*" |
    Select-Object DisplayName, InstallLocation |
    Where-Object { $_.DisplayName -ne $null } |
    Sort-Object DisplayName |
    Format-Table -AutoSize
```
 
### 2.3 检查用户目录下的绿色软件
 
```powershell
# 查看 AppData 下的程序目录
Get-ChildItem "$profilePath\AppData\Local"  -Directory | Select-Object Name, FullName
Get-ChildItem "$profilePath\AppData\Roaming" -Directory | Select-Object Name, FullName
```
 
### 2.4 卸载用户独占软件
 
**方法 A**：切换到目标用户账户登录，在"设置 → 应用 → 已安装应用"中逐一卸载。
 
**方法 B**：使用卸载字符串（管理员执行）：
 
```powershell
# 使用从注册表获取到的 UninstallString 执行卸载
$uninstallString = "从注册表查到的 UninstallString 值"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c $uninstallString" -Wait
```
 
**方法 C**：绿色软件直接删除文件夹：
 
```powershell
Remove-Item "$profilePath\AppData\Local\某软件文件夹" -Recurse -Force
```
 
### 2.5 检查 HKLM 中路径指向用户目录的孤立条目
 
```powershell
# 找出安装路径仍指向该用户目录的系统注册表条目
Get-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
                 "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*" |
    Where-Object { $_.InstallLocation -like "*$username*" } |
    Select-Object DisplayName, InstallLocation
```
 
> 找到后，手动进入注册表删除对应的注册表项。
 
---
 
## 第三步：删除用户账户
 
```powershell
# 方法一：net user（经典）
net user devel /delete
 
# 方法二：PowerShell（推荐）
Remove-LocalUser -Name "devel"
```
 
> ⚠️ 此步骤**只删除账户**，不会自动删除用户文件夹和配置文件。
 
---
 
## 第四步：删除用户配置文件目录
 
### 方法 A：通过系统界面（推荐）
 
`Win + R` → 输入 `sysdm.cpl` → 高级 → 用户配置文件 → 设置 → 选中目标用户 → 删除
 
此方法会**同时清理** `C:\Users\目标用户` 目录和 `ProfileList` 注册表项。
 
### 方法 B：通过 WMI（命令行，同样彻底）
 
```powershell
$profile = Get-WmiObject Win32_UserProfile | Where-Object { $_.LocalPath -like "*devel*" }
if ($profile) {
    $profile.Delete()  # 同时清理文件夹和注册表
} else {
    Write-Host "配置文件已不存在"
}
```
 
### 方法 C：手动删除（文件夹还在但 WMI 找不到时）
 
```powershell
# 强制删除用户文件夹
Remove-Item "C:\Users\devel" -Recurse -Force
```
 
---
 
## 第五步：清理 SID 孤儿（彻底清洁）
 
> 以下操作均使用第一步记录的 `$sid` 变量。若 PowerShell 会话已重启，请重新赋值：
> ```powershell
> $sid = "S-1-5-21-xxxxxxxxx-xxx-xxx-xxxx"  # 替换为实际 SID
> ```
 
### 5.1 ProfileList 残留确认
 
```powershell
# 确认 sysdm.cpl 是否已清理
Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList" |
    Get-ItemProperty | Select-Object PSChildName, ProfileImagePath
 
# 如有残留则删除
Remove-Item "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList\$sid" `
    -Force -ErrorAction SilentlyContinue
```
 
### 5.2 HKU 孤立 Hive
 
```powershell
# 检查
reg query HKU | findstr $sid
 
# 如有残留，先尝试卸载再删除
reg unload "HKU\$sid"
Remove-Item "Registry::HKU\$sid" -Recurse -Force -ErrorAction SilentlyContinue
```
 
### 5.3 文件 / 文件夹 ACL 中的孤立 SID
 
```powershell
# 扫描常见目录（扫描时间较长，请耐心等待）
$scanPaths = @("C:\Users", "C:\ProgramData", "C:\Program Files", "C:\Program Files (x86)")
 
foreach ($path in $scanPaths) {
    Get-ChildItem $path -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        $acl = Get-Acl $_.FullName -ErrorAction SilentlyContinue
        $acl.Access | Where-Object { $_.IdentityReference -like "*$sid*" } | ForEach-Object {
            Write-Host "发现孤儿 SID ACE：$($path) -> $($_.IdentityReference)"
        }
    }
}
```
 
```powershell
# 清理指定路径上的孤儿 SID ACE
function Remove-OrphanSidAce {
    param([string]$TargetPath, [string]$OrphanSid)
    $acl = Get-Acl $TargetPath
    $removed = $false
    $acl.Access | Where-Object { $_.IdentityReference -like "*$OrphanSid*" } | ForEach-Object {
        $acl.RemoveAccessRule($_) | Out-Null
        $removed = $true
    }
    if ($removed) {
        Set-Acl $TargetPath $acl
        Write-Host "已清理：$TargetPath"
    }
}
 
# 调用示例
Remove-OrphanSidAce -TargetPath "C:\目标路径" -OrphanSid $sid
```
 
### 5.4 注册表其他位置
 
```powershell
$regPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Group Policy\State",
    "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Terminal Server\Install\Software",
    "HKLM:\SYSTEM\CurrentControlSet\Control\hivelist",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\MountPoints2"
)
 
foreach ($path in $regPaths) {
    if (Test-Path $path) {
        Get-ChildItem $path -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -like "*$sid*" } |
            ForEach-Object {
                Write-Host "发现残留：$($_.Name)"
                Remove-Item $_.PSPath -Recurse -Force -ErrorAction SilentlyContinue
            }
    }
}
```
 
### 5.5 计划任务中的孤立 SID
 
```powershell
# 检查
Get-ScheduledTask | Where-Object { $_.Principal.UserId -like "*$sid*" } |
    Select-Object TaskName, TaskPath
 
# 删除孤立任务
Get-ScheduledTask | Where-Object { $_.Principal.UserId -like "*$sid*" } |
    Unregister-ScheduledTask -Confirm:$false
```
 
### 5.6 服务中的孤立 SID
 
```powershell
# 检查
Get-WmiObject Win32_Service |
    Where-Object { $_.StartName -like "*$sid*" } |
    Select-Object Name, StartName, State
 
# 将运行账户改为 LocalSystem 或停止并删除服务
sc.exe config "服务名" obj= "LocalSystem"
# 或删除服务
sc.exe delete "服务名"
```
 
### 5.7 本地组成员中的孤立 SID
 
```powershell
# 检查所有本地组
Get-LocalGroup | ForEach-Object {
    $groupName = $_.Name
    try {
        Get-LocalGroupMember $_ -ErrorAction SilentlyContinue |
            Where-Object { $_.SID.Value -eq $sid } |
            ForEach-Object { Write-Host "发现：组 [$groupName] 中有孤儿 SID 成员" }
    } catch {}
}
 
# 清理
Remove-LocalGroupMember -Group "组名" -Member $sid
```
 
### 5.8 环境变量残留
 
```powershell
# 检查系统环境变量中是否有指向该用户的路径
[System.Environment]::GetEnvironmentVariables("Machine").GetEnumerator() |
    Where-Object { $_.Value -like "*devel*" } |
    Select-Object Name, Value
```
 
---
 
## 第六步：全局验证
 
```powershell
# 在注册表中全局搜索 SID 残留（速度较慢，约需数分钟）
Write-Host "正在搜索 HKLM..."
reg query HKLM /f $sid /s 2>$null | findstr $sid
 
Write-Host "正在搜索 HKU..."
reg query HKU  /f $sid /s 2>$null | findstr $sid
 
# 确认用户账户已不存在
try {
    Get-LocalUser -Name "devel" -ErrorAction Stop
    Write-Host "⚠️  账户仍然存在，请重新执行第三步"
} catch {
    Write-Host "✅ 账户已删除"
}
 
# 确认用户目录已不存在
if (Test-Path "C:\Users\devel") {
    Write-Host "⚠️  用户目录仍然存在，请重新执行第四步"
} else {
    Write-Host "✅ 用户目录已删除"
}
```
 
---
 
## 各步骤清理项汇总
 
| # | 清理位置 | 重要程度 | 说明 |
|---|---------|---------|------|
| 1 | 用户独占软件（HKCU Uninstall） | ⭐⭐⭐ 必须 | 卸载仅该用户安装的软件 |
| 2 | 本地账户 | ⭐⭐⭐ 必须 | `net user /delete` 或 `Remove-LocalUser` |
| 3 | `C:\Users\目标用户` 目录 | ⭐⭐⭐ 必须 | 含所有个人文件和配置 |
| 4 | ProfileList 注册表项 | ⭐⭐ 建议 | sysdm.cpl 通常已处理 |
| 5 | HKU 孤立 Hive | ⭐⭐ 建议 | 用户注销后可清理 |
| 6 | HKLM 中孤立软件条目 | ⭐⭐ 建议 | 路径已失效的注册表项 |
| 7 | 文件 ACL 孤立 SID | ⭐ 视情况 | 洁癖级清理，扫描耗时 |
| 8 | 计划任务 / 服务 | ⭐ 视情况 | 开发用户可能设置过 |
| 9 | 本地组成员孤立 SID | ⭐ 视情况 | 较少见 |
| 10 | 环境变量 | ⭐ 视情况 | 较少见 |
| 11 | 全局注册表验证 | ⭐ 可选 | 最终确认无残留 |
 
---
 
## 注意事项
 
- 🔒 所有 PowerShell 命令需以**管理员身份**运行
- 👤 操作前确保目标用户**已完全注销**，否则 NTUSER.DAT 被锁定无法挂载
- 💾 操作前建议**备份用户目录**中的重要数据
- 🔑 **务必在删除账户前记录 SID**，账户删除后无法通过用户名查询 SID
- ⏱️ 文件 ACL 扫描（第五步 5.3）在文件较多时耗时较长，属正常现象