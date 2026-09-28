export const MYPAGE_TYPOGRAPHY = {
  pageTitle: 'text-xl leading-7 font-bold tracking-tight text-black md:text-2xl md:leading-8 md:font-black',
  sectionTitle: 'text-lg leading-6 font-bold tracking-tight text-black md:text-xl md:leading-7 md:font-black',
  cardTitle: 'text-sm leading-5 font-bold text-black md:text-base md:leading-6 md:font-black',
  body: 'text-sm leading-5 font-medium text-zinc-700',
  meta: 'text-xs leading-4 font-medium text-zinc-500',
  fieldLabel: 'text-sm leading-5 font-bold text-black',
} as const;

export const MYPAGE_CONTROL_CLASS_NAME =
  'rounded-sm border-zinc-300 bg-white text-base font-medium shadow-none md:text-sm focus-visible:border-black focus-visible:ring-[3px] focus-visible:ring-black/20';

export const MYPAGE_INPUT_CLASS_NAME = `h-10 data-[size=default]:h-10 ${MYPAGE_CONTROL_CLASS_NAME}`;
export const MYPAGE_TEXTAREA_CLASS_NAME = MYPAGE_CONTROL_CLASS_NAME;

export const MYPAGE_SELECTOR_TRIGGER_CLASS_NAME =
  'focus-visible:border-black focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-black/20';

export const MYPAGE_LIST_CARD_HEADER_CLASS_NAME =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-2.5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-y-2 md:py-4';

const actionBase =
  'rounded-sm font-bold shadow-none focus-visible:ring-[3px] focus-visible:ring-black/20';

export const MYPAGE_ACTION_CLASS_NAME = {
  outline: `${actionBase} border-zinc-300 bg-white text-black hover:border-zinc-400 hover:bg-zinc-100 hover:text-black focus-visible:border-zinc-300`,
  primary: `${actionBase} bg-black text-white hover:bg-zinc-800 focus-visible:border-transparent`,
  dangerOutline: `${actionBase} border-red-200 bg-white text-red-700 hover:border-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:border-red-200`,
  danger: `${actionBase} border-red-600 bg-red-600 text-white hover:bg-red-700 focus-visible:border-red-600`,
} as const;

export const MYPAGE_ACTION_MENU_CLASS_NAME = {
  content: 'min-w-36 p-0',
  outlineTrigger:
    'data-[state=open]:border-zinc-400 data-[state=open]:bg-zinc-100 data-[state=open]:text-black',
  quietTrigger: 'data-[state=open]:bg-zinc-100 data-[state=open]:text-black',
  item:
    'h-10 rounded-none px-4 justify-center text-center font-bold whitespace-nowrap hover:bg-zinc-100 hover:text-black focus:bg-zinc-100 focus:text-black',
  destructiveItem:
    'h-10 rounded-none px-4 justify-center text-center font-bold whitespace-nowrap hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700',
  separator: 'mx-0 my-0',
} as const;

export const MYPAGE_FORM_ACTIONS_CLASS_NAME =
  'flex w-full gap-2 md:justify-end';

export const MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME =
  'flex-1 md:w-30 md:flex-none';

export const MYPAGE_DATE_GROUP_HEADER_CLASS_NAME =
  'bg-zinc-100 px-4 py-3 md:px-5 md:py-4';

export const MYPAGE_DATE_GROUP_TITLE_CLASS_NAME =
  'text-sm leading-5 font-bold text-zinc-700';

export const MYPAGE_DIALOG_CLASS_NAME = {
  content: 'max-w-xs rounded-sm border-zinc-300 bg-white',
  title: 'text-xl font-black text-black',
  description: 'text-sm font-medium leading-relaxed text-zinc-500',
  footer: 'mt-4 grid grid-cols-2 gap-2',
  cancel: `flex-1 ${MYPAGE_ACTION_CLASS_NAME.outline}`,
  confirm: `flex-1 ${MYPAGE_ACTION_CLASS_NAME.danger}`,
  dismiss: `col-span-2 w-full ${MYPAGE_ACTION_CLASS_NAME.outline}`,
} as const;
