(function() {
  var data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Review",
        "itemReviewed": {
          "@type": "LodgingBusiness",
          "name": "Prajna Co-hab"
        },
        "author": {
          "@type": "Person",
          "name": "Priya M."
        },
        "datePublished": "2025-09-14",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 5,
          "bestRating": 5,
          "worstRating": 1
        },
        "reviewBody": "Rooms are spotless and the common areas are cleaned daily. Food is home-style, like ma ke haath ka — especially the dal and roti at dinner. Safe for women professionals, CCTV on entry and quiet neighbours."
      },
      {
        "@type": "Review",
        "itemReviewed": {
          "@type": "LodgingBusiness",
          "name": "Prajna Co-hab"
        },
        "author": {
          "@type": "Person",
          "name": "Rahul S."
        },
        "datePublished": "2025-10-02",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 5,
          "bestRating": 5,
          "worstRating": 1
        },
        "reviewBody": "Perfect location if you work in MIDC or Moshi plants — 10 min by bike. WiFi is decent for WFH, rooms are clean, and the owners are very responsive. No hidden charges."
      },
      {
        "@type": "Review",
        "itemReviewed": {
          "@type": "LodgingBusiness",
          "name": "Prajna Co-hab"
        },
        "author": {
          "@type": "Person",
          "name": "Sneha K."
        },
        "datePublished": "2025-08-21",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 4,
          "bestRating": 5,
          "worstRating": 1
        },
        "reviewBody": "Loved the kitchen and dining setup — you can actually cook when you want. Room was clean and airy. Security is good with lockable rooms and ground-floor supervision. Would recommend to colleagues."
      },
      {
        "@type": "Review",
        "itemReviewed": {
          "@type": "LodgingBusiness",
          "name": "Prajna Co-hab"
        },
        "author": {
          "@type": "Person",
          "name": "Amit T."
        },
        "datePublished": "2025-11-10",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 5,
          "bestRating": 5,
          "worstRating": 1
        },
        "reviewBody": "Clean rooms, good water supply, and 24/7 WiFi. The location is a big plus for MIDC folks. Food is optional but the home-style thali is worth it."
      }
    ]
  };
  var s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
})();
