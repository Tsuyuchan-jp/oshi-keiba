/** 第1回の連勝票とやりなおし（購入者は載せない） */

export type ExoticKind = "umaren" | "umatan" | "sanrenpuku" | "sanrentan";

export type ExoticBet = {
  id: string;
  kind: ExoticKind;
  h1: string;
  h2: string;
  h3: string | null;
  amount: number;
  createdAt: number;
};

export const EXOTIC_BETS: ExoticBet[] = [
  { id: "6a992fff-25ca-4e07-997a-d7506ddd446a", kind: "umaren", h1: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h2: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h3: null, amount: 3000, createdAt: 1787454564301 },
  { id: "1c4c8272-f20a-4e37-b2c3-6ecfd410b3b9", kind: "sanrentan", h1: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", amount: 3000, createdAt: 1787454718607 },
  { id: "f2a88196-45ac-44b2-af01-111042ffaf1b", kind: "sanrentan", h1: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", amount: 500, createdAt: 1787454795297 },
  { id: "204a7fe3-c60c-4c61-b680-33553b43cc5e", kind: "sanrentan", h1: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", amount: 500, createdAt: 1787454805979 },
  { id: "21d63a98-8de8-489c-8c24-0db4ce39b290", kind: "sanrentan", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h3: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", amount: 500, createdAt: 1787454816717 },
  { id: "ba2d23d9-74bd-4461-9861-66a2307b948a", kind: "sanrentan", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", amount: 500, createdAt: 1787454831915 },
  { id: "53fc7a52-6214-4360-8a0f-ba2b06be2c4e", kind: "sanrentan", h1: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h2: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h3: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", amount: 500, createdAt: 1787454848325 },
  { id: "2c13af94-cb70-41c2-a670-d7f7411705fc", kind: "sanrentan", h1: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", amount: 500, createdAt: 1787454858470 },
  { id: "507a37ed-0814-4e99-9a83-de2c726c5ab9", kind: "umaren", h1: "99b70e31-c96d-4112-8eb4-063499fcbee0", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: null, amount: 3000, createdAt: 1787457221890 },
  { id: "c8c93e17-618c-46b7-bd17-5d6198e280ae", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: null, amount: 500, createdAt: 1787458257590 },
  { id: "c2388e45-4877-4fa9-817a-be6ac20ef7eb", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: null, amount: 500, createdAt: 1787458281016 },
  { id: "e08dba66-6a4a-449d-b494-3e990aedbe70", kind: "sanrenpuku", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: "fe419cd2-9106-4c89-9660-f03722d59121", amount: 200, createdAt: 1787458380487 },
  { id: "8f361d23-a685-47cb-aceb-86e2e9e37753", kind: "sanrenpuku", h1: "99b70e31-c96d-4112-8eb4-063499fcbee0", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", amount: 200, createdAt: 1787458407769 },
  { id: "8684f422-b35b-4c7a-a3bd-77fa9895177b", kind: "sanrenpuku", h1: "1c11f477-9656-4900-b5c8-7cbb876073e1", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", amount: 200, createdAt: 1787458436519 },
  { id: "aea44dfb-9ccf-4d20-a118-c3524e70e4b1", kind: "sanrenpuku", h1: "79b46bd6-4c7b-407d-993d-ca7209f66226", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", amount: 200, createdAt: 1787458494852 },
  { id: "43155c1d-ec87-413c-b729-c898812d3857", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: null, amount: 500, createdAt: 1787458521778 },
  { id: "882aaaad-bdba-4aec-bdb2-ee471246ea02", kind: "sanrentan", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: "fe419cd2-9106-4c89-9660-f03722d59121", amount: 100, createdAt: 1787458567781 },
  { id: "19df7a0e-f41f-41f4-867c-a2f4bced3a89", kind: "sanrentan", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "fe419cd2-9106-4c89-9660-f03722d59121", h3: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", amount: 100, createdAt: 1787458586816 },
  { id: "20c3afb0-c76c-4f93-88e6-31c8837bc5e6", kind: "sanrenpuku", h1: "79b46bd6-4c7b-407d-993d-ca7209f66226", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: "fe419cd2-9106-4c89-9660-f03722d59121", amount: 200, createdAt: 1787458719788 },
  { id: "0c51aed9-23e6-4b21-9c56-3de45b073893", kind: "sanrenpuku", h1: "79b46bd6-4c7b-407d-993d-ca7209f66226", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: "fe419cd2-9106-4c89-9660-f03722d59121", amount: 300, createdAt: 1787458936219 },
  { id: "a7c16662-3c51-4656-aa4f-4f001c6be149", kind: "umaren", h1: "79b46bd6-4c7b-407d-993d-ca7209f66226", h2: "fe419cd2-9106-4c89-9660-f03722d59121", h3: null, amount: 500, createdAt: 1787459294327 },
  { id: "03850269-bf13-492f-8ecf-a5e8d519716a", kind: "sanrentan", h1: "79b46bd6-4c7b-407d-993d-ca7209f66226", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: "fe419cd2-9106-4c89-9660-f03722d59121", amount: 500, createdAt: 1787459434625 },
  { id: "51497cff-1f39-4911-8245-f28922029983", kind: "sanrentan", h1: "79b46bd6-4c7b-407d-993d-ca7209f66226", h2: "fe419cd2-9106-4c89-9660-f03722d59121", h3: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", amount: 500, createdAt: 1787459456421 },
  { id: "b49fac99-c88d-42e2-991f-bd30010b1a6d", kind: "sanrenpuku", h1: "1d1d3063-0d52-47e0-b7ba-a6dc2a8a92ca", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", amount: 1500, createdAt: 1787470755120 },
  { id: "0c7d8842-7de9-4790-b23c-77177bb18479", kind: "umaren", h1: "1d1d3063-0d52-47e0-b7ba-a6dc2a8a92ca", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: null, amount: 500, createdAt: 1787470803158 },
  { id: "d2cbfcd2-3283-4d45-a643-baa3ae1ac02a", kind: "sanrentan", h1: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h2: "79b46bd6-4c7b-407d-993d-ca7209f66226", h3: "1c11f477-9656-4900-b5c8-7cbb876073e1", amount: 1000, createdAt: 1787474656698 },
  { id: "78045ec1-a513-45e3-91f8-6e52febf683c", kind: "sanrenpuku", h1: "1c11f477-9656-4900-b5c8-7cbb876073e1", h2: "79b46bd6-4c7b-407d-993d-ca7209f66226", h3: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", amount: 1000, createdAt: 1787474674976 },
  { id: "59953275-4615-4a14-b08a-9c09cf7a38db", kind: "umaren", h1: "99b70e31-c96d-4112-8eb4-063499fcbee0", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: null, amount: 1000, createdAt: 1787475891325 },
  { id: "841b9f63-4990-4024-8c68-6515cb4a2b91", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h3: null, amount: 1000, createdAt: 1787475922029 },
  { id: "705b431e-9a8e-412f-aeec-029cfea2a401", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h3: null, amount: 1000, createdAt: 1787475950776 },
  { id: "e507883e-467a-482a-869e-2217c7d6b56b", kind: "umaren", h1: "99b70e31-c96d-4112-8eb4-063499fcbee0", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: null, amount: 1000, createdAt: 1787476032670 },
  { id: "47448742-d7fd-4585-80f9-fd2571b600d7", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h3: null, amount: 1000, createdAt: 1787476049181 },
  { id: "0a8dd301-ebcf-4f7f-b033-12391b149998", kind: "umaren", h1: "99b70e31-c96d-4112-8eb4-063499fcbee0", h2: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h3: null, amount: 1000, createdAt: 1787476083201 },
  { id: "089c54c8-6eff-4fb9-a181-385ff829e47b", kind: "sanrenpuku", h1: "1d1d3063-0d52-47e0-b7ba-a6dc2a8a92ca", h2: "99b70e31-c96d-4112-8eb4-063499fcbee0", h3: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", amount: 1000, createdAt: 1787481031999 },
  { id: "9e84f850-8e67-47b4-928f-7831900eb24b", kind: "umatan", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: null, amount: 100, createdAt: 1787481477238 },
  { id: "93414555-01d6-4701-9796-fef6ea9a9992", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "fb29f451-9707-4ab0-863c-ee627491b664", h3: null, amount: 100, createdAt: 1787481585802 },
  { id: "54731090-1bb7-426a-987c-c084ba19041a", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "fb29f451-9707-4ab0-863c-ee627491b664", h3: null, amount: 100, createdAt: 1787481602335 },
  { id: "134b317e-d479-4a72-b46c-bb6ff156294a", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "fb29f451-9707-4ab0-863c-ee627491b664", h3: null, amount: 100, createdAt: 1787481611768 },
  { id: "eac744fb-c029-4554-ad19-87b7e5fd4812", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "fb29f451-9707-4ab0-863c-ee627491b664", h3: null, amount: 200, createdAt: 1787481623344 },
  { id: "ff2be1c3-f668-4bd0-9e8c-a84e5ddc367b", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "fb29f451-9707-4ab0-863c-ee627491b664", h3: null, amount: 300, createdAt: 1787481645102 },
  { id: "cb0d33c0-2f20-4c5c-ae5e-956c03de5e42", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "fb29f451-9707-4ab0-863c-ee627491b664", h3: null, amount: 100, createdAt: 1787481720999 },
  { id: "cb2e1975-7f2d-4fb5-bc9f-0868e42e8c16", kind: "sanrenpuku", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h3: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 100, createdAt: 1787481779958 },
  { id: "3ef0f43a-2efa-40d7-a040-bc4ecefc4c2e", kind: "sanrentan", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h3: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 100, createdAt: 1787481906049 },
  { id: "ccb9389f-df00-4fb8-89bb-2ee53119e8f1", kind: "umatan", h1: "5c139e2f-1ce7-411d-9b04-a5bb552bc8dc", h2: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", h3: null, amount: 100, createdAt: 1787482314011 },
  { id: "4e46293a-16a9-4946-8f78-eca496d6fbcd", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "fb29f451-9707-4ab0-863c-ee627491b664", h3: null, amount: 100, createdAt: 1787482365864 },
  { id: "ea5f1409-9c1f-4fe6-b0ff-f765b8b5225a", kind: "sanrenpuku", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h3: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 100, createdAt: 1787482385994 },
  { id: "1bbc8b0e-9b85-4bb8-93da-6b5a3921980b", kind: "sanrentan", h1: "fb29f451-9707-4ab0-863c-ee627491b664", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", amount: 100, createdAt: 1787482403845 },
  { id: "d71a3bd1-6cb3-4ad4-8f1f-32d77dfdb414", kind: "umaren", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "fb29f451-9707-4ab0-863c-ee627491b664", h3: null, amount: 100, createdAt: 1787482497979 },
  { id: "a39cf1f3-7bbc-4f33-a68e-936aace8c031", kind: "sanrenpuku", h1: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h2: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", h3: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 100, createdAt: 1787482523593 },
  { id: "822f2c71-51cd-4c8f-b35e-42ec5023a1f9", kind: "sanrentan", h1: "fb29f451-9707-4ab0-863c-ee627491b664", h2: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", h3: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", amount: 100, createdAt: 1787482542041 },
];

export const REDOS: { betId: string; at: number }[] = [
  { betId: "6a992fff-25ca-4e07-997a-d7506ddd446a", at: 1787454575021 },
  { betId: "acbb5f88-3075-48ee-ba50-fbf3887b4191", at: 1787454631483 },
  { betId: "1c4c8272-f20a-4e37-b2c3-6ecfd410b3b9", at: 1787454735584 },
  { betId: "cc354470-f28f-4988-b76f-beb30cce48fb", at: 1787458298372 },
  { betId: "c8c93e17-618c-46b7-bd17-5d6198e280ae", at: 1787458298372 },
  { betId: "c2388e45-4877-4fa9-817a-be6ac20ef7eb", at: 1787458298372 },
  { betId: "27052e63-d434-4303-a69d-6ad0dd9103d5", at: 1787458950820 },
  { betId: "59953275-4615-4a14-b08a-9c09cf7a38db", at: 1787475985491 },
  { betId: "841b9f63-4990-4024-8c68-6515cb4a2b91", at: 1787475985491 },
  { betId: "705b431e-9a8e-412f-aeec-029cfea2a401", at: 1787475985491 },
  { betId: "982df5b7-2d24-49f4-bdd7-1e9bd08f5874", at: 1787481491409 },
  { betId: "182c76b2-3bb9-4a5d-a7f0-be7484f5d2bb", at: 1787481491409 },
  { betId: "68af7b7b-3974-43eb-8653-6a7562aa5a1b", at: 1787481491409 },
  { betId: "9e84f850-8e67-47b4-928f-7831900eb24b", at: 1787481491409 },
  { betId: "5a6d9db9-3532-4364-8a0f-e4a768b7da86", at: 1787481657924 },
  { betId: "93414555-01d6-4701-9796-fef6ea9a9992", at: 1787481657924 },
  { betId: "54731090-1bb7-426a-987c-c084ba19041a", at: 1787481657924 },
  { betId: "134b317e-d479-4a72-b46c-bb6ff156294a", at: 1787481657924 },
  { betId: "eac744fb-c029-4554-ad19-87b7e5fd4812", at: 1787481657924 },
  { betId: "ff2be1c3-f668-4bd0-9e8c-a84e5ddc367b", at: 1787481657924 },
  { betId: "27044d0a-0654-4d51-a932-311c74ec1dbe", at: 1787482341063 },
  { betId: "cb0d33c0-2f20-4c5c-ae5e-956c03de5e42", at: 1787482341063 },
  { betId: "cb2e1975-7f2d-4fb5-bc9f-0868e42e8c16", at: 1787482341063 },
  { betId: "3ef0f43a-2efa-40d7-a040-bc4ecefc4c2e", at: 1787482341063 },
  { betId: "ccb9389f-df00-4fb8-89bb-2ee53119e8f1", at: 1787482341063 },
  { betId: "54e31901-f049-4962-9a92-3ab66ef01b13", at: 1787482429015 },
  { betId: "4e46293a-16a9-4946-8f78-eca496d6fbcd", at: 1787482429015 },
  { betId: "ea5f1409-9c1f-4fe6-b0ff-f765b8b5225a", at: 1787482429015 },
  { betId: "1bbc8b0e-9b85-4bb8-93da-6b5a3921980b", at: 1787482429015 },
  { betId: "13fa927d-7d31-4d52-9b66-d5aab01e456e", at: 1787482451549 },
];
