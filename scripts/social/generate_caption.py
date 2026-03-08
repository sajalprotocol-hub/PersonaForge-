import random
from datetime import datetime

CAPTION_TEMPLATES = {
    "Mon": {
        "theme": "Mega Monday",
        "hooks": [
            "Start your week with a career glow-up. ✨",
            "Mon_days are for major moves. 💼",
            "Stop applying with that 2020 resume. It's time for a rebuild."
        ],
        "body": "Watch PersonaForge transform a basic doc into a high-impact, ATS-optimized narrative in under 60 seconds. Our AI doesn't just format; it forges.",
        "hashtags": "#MegaMonday #ResumeRebuild #CareerGrowth #PersonaForge #JobHunt"
    },
    "Tue": {
        "theme": "Tech Tuesday",
        "hooks": [
            "The 90% match secret is out. 🎯",
            "Stop guessing. Start matching.",
            "Beat the ATS at its own game."
        ],
        "body": "Our JD Matcher uses dimensional analysis to sync your resume with any job description. Precision matters when you're hunting for that dream role.",
        "hashtags": "#TechTuesday #JDMatch #AI #RecruitmentTech #CareerSuccess"
    },
    "Wed": {
        "theme": "Warp Wednesday",
        "hooks": [
            "Resume building at the speed of light. ⚡",
            "Done in 60 seconds? Yes.",
            "Efficiency is the new competitive advantage."
        ],
        "body": "Why spend hours formatting when our AI can do it in seconds? Shift your focus from editing to interviewing.",
        "hashtags": "#WarpWednesday #Efficiency #Productivity #JobSearch #AITools"
    },
    # Add more days as needed...
}

def generate_caption():
    day = datetime.now().strftime("%a")
    content = CAPTION_TEMPLATES.get(day, CAPTION_TEMPLATES["Mon"])
    
    hook = random.choice(content["hooks"])
    caption = f"{hook}\n\n{content['body']}\n\n{content['hashtags']}\n\nLink in bio: personaforge.ai 🚀"
    
    return caption

if __name__ == "__main__":
    print("-" * 30)
    print(f"TODAY'S THEME: {CAPTION_TEMPLATES.get(datetime.now().strftime('%a'), CAPTION_TEMPLATES['Mon'])['theme']}")
    print("-" * 30)
    print(generate_caption())
