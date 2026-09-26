export type RootStackParamList = {
  Tabs: undefined;
  Movie: { id: string };
  Genre: { genre: string };
  Downloads: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Profile: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
