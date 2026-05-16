/**
 * 这个文件作为组件的目录
 * 目的是统一管理对外输出的组件，方便分类
 */
/**
 * 布局组件
 */
import Footer from './Footer';
import { SelectLang, ThemeSwitcher } from './RightContent';
import { AvatarDropdown, AvatarName } from './RightContent/AvatarDropdown';

/**
 * 业务组件
 */
export { default as ArticleListContent } from './ArticleListContent';
export { default as AvatarList } from './AvatarList';
export { default as StandardFormRow } from './StandardFormRow';
export type { StatusTagTone } from './StatusTag';
export { default as StatusTag, statusToneFromAntdColor } from './StatusTag';
export { default as TagSelect } from './TagSelect';

export { AvatarDropdown, AvatarName, Footer, SelectLang, ThemeSwitcher };
