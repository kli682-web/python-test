const normalizeText = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const buildMenuChunks = (document) => {
  const metadata = document.metadata || {};
  const source = document.source || {};

  const semanticBlocks = [
    {
      label: 'menu_summary',
      content: [
        source.name,
        `Category: ${metadata.category || 'unknown'}`,
        `Restaurant: ${metadata.restaurantName || 'Unknown Restaurant'}`,
      ].join('. '),
    },
    {
      label: 'price_value',
      content: [
        `Price: ${metadata.price ?? 'unknown'}`,
        `Restaurant price range: ${metadata.priceRange || 'unknown'}`,
        `Rating: ${metadata.rating ?? 'unknown'}`,
      ].join('. '),
    },
    {
      label: 'cuisine_location',
      content: [
        `Cuisine: ${(metadata.cuisineTypes || []).join(', ') || 'unknown'}`,
        `Address: ${metadata.address || 'unknown'}`,
      ].join('. '),
    },
  ];

  return semanticBlocks
    .map((block, index) => ({
      id: `${document.id}:chunk:${block.label}:${index}`,
      documentId: document.id,
      type: document.type,
      content: normalizeText(block.content),
      metadata: {
        ...metadata,
        blockType: block.label,
      },
      source: document.source,
    }))
    .filter((chunk) => chunk.content);
};

const buildRestaurantChunks = (document) => {
  const metadata = document.metadata || {};
  const source = document.source || {};

  const semanticBlocks = [
    {
      label: 'restaurant_summary',
      content: [
        source.name,
        `Cuisine: ${(metadata.cuisineTypes || []).join(', ') || 'unknown'}`,
        `Price range: ${metadata.priceRange || 'unknown'}`,
      ].join('. '),
    },
    {
      label: 'location_access',
      content: [
        `Address: ${metadata.address || 'unknown'}`,
        metadata.googleMapsUrl ? `Map: ${metadata.googleMapsUrl}` : '',
      ].join('. '),
    },
    {
      label: 'quality_signal',
      content: [`Rating: ${metadata.rating ?? 'unknown'}`, `Restaurant: ${source.name || metadata.restaurantName || 'unknown'}`].join('. '),
    },
  ];

  return semanticBlocks
    .map((block, index) => ({
      id: `${document.id}:chunk:${block.label}:${index}`,
      documentId: document.id,
      type: document.type,
      content: normalizeText(block.content),
      metadata: {
        ...metadata,
        blockType: block.label,
      },
      source: document.source,
    }))
    .filter((chunk) => chunk.content);
};

export const buildDocumentChunks = (documents = []) =>
  documents.flatMap((document) => {
    if (document.type === 'menu_item') {
      return buildMenuChunks(document);
    }

    if (document.type === 'restaurant') {
      return buildRestaurantChunks(document);
    }

    return [
      {
        id: `${document.id}:chunk:default:0`,
        documentId: document.id,
        type: document.type,
        content: normalizeText(document.content),
        metadata: document.metadata,
        source: document.source,
      },
    ].filter((chunk) => chunk.content);
  });
