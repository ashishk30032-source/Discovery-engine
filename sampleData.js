// Curated realistic user feedback datasets about Google Photos retrieval & search failures
// Sourced from patterns in r/googlephotos, Play Store reviews, iOS App Store reviews, and Google Support Forums

export const SAMPLE_DATASETS = [
  {
    id: 'google-photos-mixed',
    name: 'Google Photos Real-world Pain Points (12 Reviews)',
    description: 'Realistic mix of Reddit, Play Store, and forum posts highlighting core retrieval failures.',
    text: `Play Store Review - 1 star
I know I took a picture of my blue health insurance card sometime around the end of last year or early January, but searching "insurance", "card", "blue card", or "health" brings up hundreds of random photos of receipts, driver licenses, and blue shirts. I had to scroll through 4 months of my camera roll manually while standing at the pharmacy counter. Why can't it just search the actual text inside the card reliably or let me filter by "photos with text taken in winter"?

Reddit post - r/googlephotos
Does anyone else find it infuriating trying to find photos when you remember the people who were there but not where it happened? I searched "Sarah and Dave" and Google Photos just shows me every photo of Sarah ever taken and every photo of Dave ever taken separately. I only want photos where BOTH of them are in the same frame! I gave up and asked Dave to text it to me instead.

Google Support Community
I'm looking for a picture of my Golden Retriever puppy sleeping inside a cardboard Amazon box. When I search "dog inside box" or "dog cardboard box", it gives me thousands of pictures of my dog in the backyard, or pictures of packages on my porch with no dog in them. The search engine doesn't understand prepositions or spatial relationships at all. I had to scroll back through 3 years of photos to find it for an Instagram post.

App Store Review - 2 stars
Google Photos is amazing until you need to find a specific screenshot. I took a screenshot of a thai curry recipe from a food blog about 6 months ago. Searching "curry recipe" gives me pictures of actual food I ate at restaurants, but completely ignores the screenshot containing the actual recipe ingredients. I spent 25 minutes scrolling through the 'Screenshots' folder one by one.

Reddit post - r/googlephotos
Why is date search so rigid? I know for a fact I went to a concert "around the weekend before Thanksgiving 2023", but if I type "concert November 2023" it dumps 400 photos of random things from that entire month. If I try "concert late November" it gets confused and gives me zero results. I ended up opening Google Maps timeline to find the exact date first, then went back to Google Photos to jump to that calendar day.

Play Store Review - 2 stars
I was trying to show a coworker the photo of the vintage yellow car parked outside a diner that we saw during our road trip. I couldn't remember what small town it was in, only that it was a bright yellow classic convertible next to a neon sign. Searching "yellow car neon" gave me taxi cabs from New York and yellow warning street signs. The search treats words as random keywords rather than describing a single scene. I never found it.

Reddit post - r/android
Search used to feel magical, but now trying to find videos is impossible. I remember taking a 10-second video of my toddler laughing on a swing set at sunset. When I search "toddler laughing swing", it shows photos of swings with nobody on them and static pictures of my kid. It seems like it barely analyzes video content or audio at all. I had to filter by Videos and scroll for an hour.

Google Support Forum
My mom passed away 2 years ago and I wanted to find photos of her laughing or smiling outdoors in her garden. Searching "mom garden smiling" brings up photos of random flowers, my sister in the yard, and photos of mom looking serious indoors. I don't know the exact year or month she planted those sunflowers, so chronological scrolling is painful. I wish I could search by emotional expression or scene mood.

Play Store Review - 3 stars
It can't distinguish between my twin boys. When I search for Leo, it includes hundreds of photos of his brother Max. I understand they look alike, but even when I manually untag them or try to search "Leo wearing red shirt" (which only Leo wore on his birthday), it completely ignores the clothing context and just shows both kids. I had to create a dedicated manual album for each kid's school events.

App Store Review - 2 stars
I took a picture of the whiteboard at our annual product strategy offsite in Q3. I remember there was a diagram with circles and the word "Velocity". Searching "whiteboard velocity" yielded zero results even though the text is clearly legible in the center of the photo. OCR in Google Photos seems completely hit or miss. I ended up Slack messaging my team to ask if anyone saved it locally.

Reddit post - r/googlephotos
Retrieval is terrible when you have partial memory of relative events. For example, "photos taken the day we bought our new couch" or "the morning after Mike's wedding". Obviously Google doesn't know my personal life events, but why can't it correlate with calendar or let me search "photos taken near [hotel name] the day after [event]"? I spent 40 minutes cross-referencing my credit card statement to find the date of the couch delivery.

Play Store Review - 1 star
Every time I search for an item of clothing, like "green jacket", it returns every picture where there's green grass, trees, or a green wall, regardless of what jacket I was wearing. The object segmentation is way too primitive for clothing attributes. I gave up and just made an album called 'Outfits' so I wouldn't have to search ever again.`
  },
  {
    id: 'events-chronology',
    name: 'Event & Temporal Failure Focus (8 Reviews)',
    description: 'Complaints centered around episodic memory, approximate dates, and relative timeline retrieval.',
    text: `Reddit post - r/googlephotos
I hate that I have to know the exact calendar date to find anything. Human memory works in seasons and relative time! "Summer vacation before sophomore year", "the camping trip where it rained every day", "the weekend we moved into our first apartment". If you don't know if that was June 2018 or July 2019, you're stuck scrolling thousands of images.

Play Store Review - 2 stars
Searching "Christmas with Grandma" should show photos from Christmas gatherings where Grandma was present. Instead it shows pictures of Grandma from random days in March, mixed with Christmas trees from 2015. It doesn't understand intersecting context between holiday events and specific people.

App Store Review - 1 star
I was looking for photos from my sister's bachelorette party in Miami. I searched "Miami bachelorette party" and got nothing because the photos don't have the word "bachelorette" written on them. But it has 6 women in matching swimwear at a Miami beach! Why isn't the AI smart enough to infer celebration or group trip context?

Google Support Forum
Can we please get a search filter for "photos taken between 8pm and 2am"? When I want to find party or concert photos from a weekend trip, I have to sift through hundreds of daytime sightseeing pictures. Time-of-day search is completely broken.

Reddit post - r/android
I wanted to find a photo from "last time it snowed heavily in Seattle". I don't remember the exact day in January or February 2021. Typing "Seattle heavy snow" gave me generic ski trip photos from Whistler from 5 years earlier because of GPS tagging mistakes.

Play Store Review - 3 stars
Every time I look for our road trip photos, it splits them into dozens of random city tags instead of grouping the continuous journey. I remember we drove from Denver to Moab over 5 days, but searching "road trip Denver Moab" returns blank. I had to manually build an album by selecting 300 photos one by one.

Google Support Forum
Searching "photos before 2020" or "photos taken 5 years ago today" works sometimes, but complex queries like "trip to Italy right before COVID" completely fail. The search has zero world knowledge or context awareness.

Play Store Review - 2 stars
I needed a photo of my passport before my flight. I knew I took it about 2 weeks before traveling to Japan in October 2022. I spent 15 minutes searching "passport" and it brought up old expired IDs and PDF documents instead of the recent photo.`
  },
  {
    id: 'visual-sensory',
    name: 'Visual & Sensory Recall Failures (8 Reviews)',
    description: 'Failures when users remember visual colors, composition, obscure background objects, or screenshots.',
    text: `Reddit post - r/googlephotos
Why is color-based search so awful? I explicitly remember taking a photo of a woman in a bright red velvet dress against a dark background. Searching "red dress" returns photos with red soda cans, red bricks, and red text on receipts. The subject's clothing color is completely lost.

Play Store Review - 1 star
I took a picture of a wine bottle label so I would remember what to buy at the store. I forgot the brand name, but remember the label had an owl illustration on it. Searching "wine owl" gave me 0 results. It found other wine bottles and birds in the zoo, but failed to detect the graphic on the label. Had to buy a different wine.

App Store Review - 2 stars
Screenshots with handwritten notes are invisible to Google Photos search. I have dozens of sketches and diagrams with handwritten text from my design meetings. Searching for the words written with Apple Pencil returns nothing. The OCR only works on printed typography.

Google Support Forum
I have 4 cats that look somewhat similar (tabby coats). Google Photos groups all 4 into one single entity called "Cat". I can't search "orange tabby sleeping" or distinguish between them at all. It's ridiculous that human facial recognition is so advanced but pet recognition hasn't improved in 6 years.

Reddit post - r/androidapps
Trying to find a picture based on spatial layout is impossible. "Photo with Eiffel tower in background on the left" or "group photo where John is sitting on the floor". Search only cares about tagging labels, not spatial relations or composition.

Play Store Review - 2 stars
Searching for memes or funny images saved to my phone is a nightmare. I remember the meme had a dog wearing sunglasses sitting in a burning room. Searching "dog sunglasses fire" gave me actual fire department training photos from my work. It doesn't understand memes or illustration styles.

App Store Review - 3 stars
I remember taking a picture of my car's dashboard when the odometer hit exactly 100,000 miles. Searching "odometer 100000" or "car mileage" gave me photos of my car parked outside and random speed limit signs. The numbers on the gauge cluster were totally missed.

Google Support Forum
I took a photo of a business card at a conference last month. The card had embossed silver foil lettering. Search for the person's name or company brings up nothing because the reflective foil tricked the OCR. I had to search through 600 conference photos manually.`
  }
];

// Attach to window for direct browser runtime compatibility
if (typeof window !== 'undefined') {
  window.SAMPLE_DATASETS = SAMPLE_DATASETS;
}
