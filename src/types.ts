// Type definitions for the tag management system

export interface Tag {
  id: string;
  content: string; // Chinese characters
}

export interface TagManagerState {
  activeTags: Tag[];
  deletedTags: Tag[];
  inputValue: string;
}