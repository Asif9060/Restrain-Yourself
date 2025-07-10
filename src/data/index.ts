import { Habit, Quote, HealthTip, HabitCategory } from "@/types";

export const predefinedHabits: Omit<Habit, "id" | "createdAt">[] = [
   {
      name: "No Smoking",
      category: "smoking",
      color: "#ef4444",
      icon: "Cigarette",
      isCustom: false,
      description: "Avoid smoking cigarettes, cigars, or any tobacco products",
   },
   {
      name: "No Drinking",
      category: "drinking",
      color: "#f59e0b",
      icon: "Wine",
      isCustom: false,
      description: "Abstain from alcoholic beverages",
   },
   {
      name: "No Adult Content",
      category: "adult-content",
      color: "#8b5cf6",
      icon: "EyeOff",
      isCustom: false,
      description: "Avoid viewing adult or inappropriate content",
   },
   {
      name: "Limit Social Media",
      category: "social-media",
      color: "#06b6d4",
      icon: "Smartphone",
      isCustom: false,
      description: "Reduce excessive social media usage",
   },
   {
      name: "No Junk Food",
      category: "junk-food",
      color: "#10b981",
      icon: "Cookie",
      isCustom: false,
      description: "Avoid processed and unhealthy foods",
   },
];

export const motivationalQuotes: Quote[] = [
   // Smoking
   {
      text: "The best time to plant a tree was 20 years ago. The second best time is now.",
      author: "Chinese Proverb",
      category: "smoking",
   },
   {
      text: "Quitting smoking is easy. I've done it a thousand times.",
      author: "Mark Twain",
      category: "smoking",
   },
   {
      text: "Your body is a temple. Keep it pure and clean for the soul to reside in.",
      author: "B.K.S. Iyengar",
      category: "smoking",
   },

   // Drinking
   {
      text: "Recovery is not a destination, but a way of life.",
      author: "Anonymous",
      category: "drinking",
   },
   {
      text: "The first step towards getting somewhere is to decide you're not going to stay where you are.",
      author: "J.P. Morgan",
      category: "drinking",
   },
   {
      text: "Sobriety is a journey, not a destination.",
      author: "Anonymous",
      category: "drinking",
   },

   // Adult Content
   {
      text: "Purity is not thinking evil; purity is having beautiful thoughts.",
      author: "Swami Sivananda",
      category: "adult-content",
   },
   {
      text: "The mind is everything. What you think you become.",
      author: "Buddha",
      category: "adult-content",
   },
   {
      text: "Your thoughts shape your reality. Choose them wisely.",
      author: "Anonymous",
      category: "adult-content",
   },

   // Social Media
   {
      text: "Life is what happens when you're not scrolling through your phone.",
      author: "Anonymous",
      category: "social-media",
   },
   {
      text: "Connection is why we're here. We are hardwired to connect with others.",
      author: "Brené Brown",
      category: "social-media",
   },
   {
      text: "The real world is where the real connections happen.",
      author: "Anonymous",
      category: "social-media",
   },

   // Junk Food
   {
      text: "Take care of your body. It's the only place you have to live.",
      author: "Jim Rohn",
      category: "junk-food",
   },
   {
      text: "Your body is your temple. Keep it pure and clean for the soul to reside in.",
      author: "B.K.S. Iyengar",
      category: "junk-food",
   },
   {
      text: "Health is not about the weight you lose, but about the life you gain.",
      author: "Anonymous",
      category: "junk-food",
   },
];

export const healthTips: HealthTip[] = [
   // Smoking
   {
      title: "Immediate Benefits of Quitting Smoking",
      content:
         "Within 20 minutes of quitting, your heart rate and blood pressure drop. Within 12 hours, carbon monoxide levels normalize. Within 2-3 months, circulation improves and lung function increases.",
      category: "smoking",
      source: "American Cancer Society",
   },
   {
      title: "Managing Smoking Cravings",
      content:
         "Cravings typically last 3-5 minutes. Try deep breathing, drinking water, chewing gum, or engaging in physical activity. The urge will pass.",
      category: "smoking",
      source: "CDC",
   },

   // Drinking
   {
      title: "Benefits of Reducing Alcohol",
      content:
         "Reducing alcohol intake improves liver function, enhances sleep quality, boosts immune system, and can lead to better mental clarity and mood stability.",
      category: "drinking",
      source: "National Institute on Alcohol Abuse",
   },
   {
      title: "Healthy Alternatives to Alcohol",
      content:
         "Try sparkling water with fruit, herbal teas, or mocktails. Engage in activities like exercise, reading, or hobbies to replace drinking habits.",
      category: "drinking",
      source: "Mayo Clinic",
   },

   // Adult Content
   {
      title: "Mental Health Impact",
      content:
         "Reducing exposure to explicit content can improve focus, relationships, and self-esteem. It helps develop healthier attitudes towards intimacy and relationships.",
      category: "adult-content",
      source: "American Psychological Association",
   },
   {
      title: "Building Healthy Habits",
      content:
         "Replace screen time with physical activities, reading, learning new skills, or socializing. Create a structured daily routine to minimize idle time.",
      category: "adult-content",
      source: "Psychology Today",
   },

   // Social Media
   {
      title: "Digital Detox Benefits",
      content:
         "Limiting social media use can reduce anxiety, improve sleep, increase productivity, and enhance face-to-face relationships. Start with designated phone-free hours.",
      category: "social-media",
      source: "Harvard Health Publishing",
   },
   {
      title: "Mindful Social Media Use",
      content:
         "Set specific times for checking social media, unfollow accounts that make you feel negative, and engage more in real-world activities and relationships.",
      category: "social-media",
      source: "American Psychological Association",
   },

   // Junk Food
   {
      title: "Nutrition for Better Health",
      content:
         "Replace processed foods with whole foods like fruits, vegetables, lean proteins, and whole grains. This improves energy levels, mood, and overall health.",
      category: "junk-food",
      source: "American Heart Association",
   },
   {
      title: "Breaking Junk Food Cravings",
      content:
         "Stay hydrated, eat regular balanced meals, get adequate sleep, and keep healthy snacks available. Cravings often indicate nutritional deficiencies.",
      category: "junk-food",
      source: "Academy of Nutrition and Dietetics",
   },
];

export const getRandomQuote = (category?: HabitCategory): Quote => {
   const quotes = category
      ? motivationalQuotes.filter((q) => q.category === category)
      : motivationalQuotes;
   return quotes[Math.floor(Math.random() * quotes.length)];
};

export const getHealthTip = (category: HabitCategory): HealthTip => {
   const tips = healthTips.filter((tip) => tip.category === category);
   return tips[Math.floor(Math.random() * tips.length)];
};
