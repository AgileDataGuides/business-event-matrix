// The design tokens the Steps tab uses, copied from design/tokens.md.
//
// tokens.md is AUTHORITATIVE: if this file and tokens.md disagree, tokens.md
// wins. They live here, not imported from @context-plane/shared/design-tokens,
// because scripts/publish-app.sh does not bundle that module into the public
// repo. The Concept Model keeps its own copy for the same reason.

/** tokens.md buttons */
export const BUTTON = {
	/** buttons.success_create_outlined */
	add: 'px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 transition-colors',
	/** buttons.secondary_slate */
	secondary: 'px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors'
};

/** tokens.md form_inputs */
export const INPUT = {
	/** form_inputs.text */
	text: 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white',
	/** form_inputs.textarea */
	textarea: 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white',
	/** form_inputs.label_small */
	label: 'block text-[10px] font-medium text-slate-500 mb-1'
};

/** tokens.md bem_steps.event_card: one Event in a marking step, or one gap in Step 8 (DESIGN_SYSTEM.md § 22) */
export const CARD = 'bg-white rounded-lg shadow-sm border border-slate-200 p-3';

/** tokens.md typography */
export const TEXT = {
	/** bem_steps.section_heading: the canvas section header, coloured inline with the entity or 7W colour */
	sectionHeading: 'text-[10px] font-bold uppercase tracking-wider',
	/** typography.tiny in slate-400: a section's count */
	count: 'text-[10px] text-slate-400',
	/** typography.label_tier2b */
	label: 'text-[10px] font-semibold uppercase tracking-wider text-slate-500',
	/** typography.card_title */
	cardTitle: 'text-xs font-medium text-slate-800 leading-tight',
	/** typography.placeholder_italic_unset, at typography.small */
	empty: 'text-xs text-slate-300 italic'
};

/** tokens.md event_matrix.name_button (part of bem_steps.event_name): an Event's name, one click opens the edit popup */
export const NAME_BUTTON = 'text-left cursor-pointer hover:underline decoration-dotted underline-offset-2';

/** tokens.md bem_steps.chip_star: event_matrix.star's amber at the chip's text size, the ✭ on a driving Concept's chip */
export const STAR = 'text-amber-500';

/** tokens.md choice_chips: a Domain or a Concept an Event can be marked with */
export const CHIP = {
	wrapper: 'inline-flex flex-wrap gap-1',
	base: 'px-2 py-0.5 text-[11px] font-medium rounded-md border transition-colors',
	active: 'bg-blue-50 text-blue-700 border-blue-300',
	inactive: 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
};

/** tokens.md state_chips */
export const STATE_CHIP = {
	base: 'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border',
	positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	warning: 'bg-amber-50 text-amber-700 border-amber-200'
};

/** tokens.md row_actions.neutral */
export const ROW_ACTION = 'text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors';

/** tokens.md step_rail: the steps down the left of the Steps tab (DESIGN_SYSTEM.md § 18 Step Rail, § 22). */
export const STEP_RAIL = {
	container: 'w-72 shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto',
	row: 'w-full text-left flex items-start gap-2 px-3 py-2 border-l-2 transition-colors',
	rowActive: 'bg-white border-blue-600',
	rowInactive: 'border-transparent hover:bg-slate-100',
	labelActive: 'text-xs font-semibold text-slate-800',
	labelInactive: 'text-xs font-medium text-slate-600',
	status: 'text-[10px] text-slate-400 leading-tight',
	dotStarted: 'mt-1 w-2 h-2 shrink-0 rounded-full bg-slate-600',
	dotEmpty: 'mt-1 w-2 h-2 shrink-0 rounded-full border border-slate-300'
};

/** tokens.md step_panel: the header of the selected step (DESIGN_SYSTEM.md § 18 Step Panel). */
export const STEP_PANEL = {
	label: 'text-xs font-semibold text-slate-500',
	question: 'text-base font-semibold text-slate-800',
	description: 'text-xs text-slate-500 leading-relaxed',
	guide: 'text-xs text-slate-700 leading-relaxed',
	body: 'px-6 py-5'
};

/** tokens.md step_nav: Back and Next under the selected step (DESIGN_SYSTEM.md § 18 Step Nav). */
export const STEP_NAV = {
	bar: 'shrink-0 flex items-center justify-between gap-3 px-6 py-2.5 border-t border-slate-200 bg-white',
	/** buttons.secondary_slate, with room for the arrow */
	button:
		'inline-flex items-center gap-1.5 min-w-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors',
	label: 'truncate',
	/** Heroicons outline arrow-left / arrow-right */
	icon: 'w-4 h-4 shrink-0'
};

/** tokens.md bem_steps.w_label: the 7W name to the left of its chips in a marking step */
export const W_LABEL = 'w-20 shrink-0 pt-1';

/** tokens.md bem_steps.gap_item: one item in a gap in Step 8 */
export const GAP_ITEM = 'text-xs text-slate-700';

/** tokens.md bem_steps.content: the panel under the step header */
export const STEP_CONTENT = 'max-w-3xl';
