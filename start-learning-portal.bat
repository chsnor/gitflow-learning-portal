@echo off
chcp 65001 > nul
echo ========================================================
echo   เปิดเว็บเรียนรู้โค้ด GitFlow Visualizer (Developer Tracer)
echo ========================================================
echo กำลังเปิด index.html บนเว็บเบราว์เซอร์ของคุณ...
start "" "%~dp0index.html"
exit
