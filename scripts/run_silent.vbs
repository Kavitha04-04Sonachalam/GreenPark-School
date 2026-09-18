Set WshShell = CreateObject(WScript.Shell)
WshShell.CurrentDirectory = E:\Learnings\Vishagar\GreenPark-School
WshShell.Run cmd /c start_lan_server.bat, 0, False
