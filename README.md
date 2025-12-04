
## How It Works

### Timer Logic
- Stopwatch uses `requestAnimationFrame()` for real-time precision  
- Pomodoro uses corrected `setInterval()` to prevent drift  
- Shared utilities handle **time** and **date** formatting  

### Database
- IndexedDB stores:
  - Timer Type  
  - Duration  
  - Timestamp  
- History tab fetches + renders sessions dynamically  

### Presence Detection
- Camera is activated with permission  
- Face presence checked continuously  
- Pomodoro auto-pauses if user leaves  
- Alerts notify the user  

## Usage

1. **Open the app in browser**  
2. Navigate using top tabs: Stopwatch | Pomodoro | History  
3. Start your timer  
4. Save completed sessions  
5. View and delete past sessions in History  
6. Enable camera presence detection from Pomodoro settings  

## Future Improvements

- Add weekly/monthly analytics  
- Add long-break cycles  
- Export history to CSV  
- Light/Dark theme toggle  
- Merge Stopwatch + Pomodoro stats dashboard  

## Author

**Krrish Biswas**  
Frontend Developer Associate  
B.Tech CSE (AI/ML)  
2025 - 2029
**Anish Kashyap
Frontend Developer Associate
B.Tech CSE (AI/ML)
2025 - 2029

## Acknowledgments

- HTML5 & CSS3 docs  
- MDN Web Docs  
- JavaScript Web APIs  
- IndexedDB documentation  
- Inspirations from productivity apps like Forest & Clockify

## License

This project is licensed under the MIT License.


