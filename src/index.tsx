import {
  Action,
  ActionPanel,
  Form,
  List,
  showToast,
  Toast,
  getPreferenceValues,
  LaunchProps,
  Icon,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { findMatchingRepositories, FoundRepo, SearchOptions } from "./repo";
import { OpenMethod, openMethods } from "./utils/open-with";

interface Preferences {
  maxDepth: string;
  excludeDirs: string;
  searchPath: string;
  defaultOpenMethod: string;
}

interface Arguments {
  gitUrl?: string;
}

export default function FindYourRepo(props: LaunchProps<{ arguments: Arguments }>) {
  const [gitUrl, setGitUrl] = useState(props.arguments?.gitUrl || "");
  const [repos, setRepos] = useState<FoundRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const preferences = getPreferenceValues<Preferences>();

  const searchOptions: Partial<SearchOptions> = {
    maxDepth: parseInt(preferences.maxDepth) || 3,
    excludeDirs: preferences.excludeDirs ? preferences.excludeDirs.split(",").map((s) => s.trim()) : undefined,
  };

  const searchPath = preferences.searchPath || process.env.HOME || "/Users";
  const defaultOpenMethod = preferences.defaultOpenMethod || "cursor";

  const handleSearch = async () => {
    if (!gitUrl.trim()) {
      showToast(Toast.Style.Failure, "错误", "请输入git地址");
      return;
    }

    setIsLoading(true);
    setSearchPerformed(true);

    try {
      const foundRepos = await findMatchingRepositories(gitUrl, searchPath, searchOptions);
      setRepos(foundRepos);

      if (foundRepos.length === 0) {
        showToast(Toast.Style.Failure, "未找到", "没有找到匹配的仓库");
      } else {
        showToast(Toast.Style.Success, "成功", `找到 ${foundRepos.length} 个匹配的仓库`);
      }
    } catch (error) {
      console.error("搜索错误:", error);
      showToast(Toast.Style.Failure, "错误", "搜索过程中发生错误");
    } finally {
      setIsLoading(false);
    }
  };
  const tryOpen = (method: OpenMethod, path: string) => {
    try {
      method.open(path);
    } catch (error) {
      console.error("打开错误:", error);
      showToast(Toast.Style.Failure, "错误", "打开失败");
    }
  };
  const defaultMethod = openMethods.find((method) => method.value === defaultOpenMethod);
  const otherMethods = openMethods.filter((method) => method.value !== defaultOpenMethod);

  useEffect(() => {
    handleSearch();
  }, []);

  if (!searchPerformed) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action title="搜索" onAction={handleSearch} />
          </ActionPanel>
        }
      >
        <Form.TextField
          id="gitUrl"
          title="Git 地址"
          placeholder="输入 git 地址，如：https://github.com/user/repo.git"
          value={gitUrl}
          onChange={setGitUrl}
        />
        <Form.Description text={`搜索路径: ${searchPath}`} />
        <Form.Description text={`搜索深度: ${searchOptions.maxDepth} 层`} />
        <Form.Description text={`排除目录: ${searchOptions.excludeDirs?.join(", ") || "使用默认排除列表"}`} />
      </Form>
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="搜索仓库..."
      children={
        repos.length === 0 && !isLoading ? (
          <List.EmptyView
            title="未找到匹配的仓库"
            description="尝试检查git地址是否正确，或者调整搜索路径和深度"
            actions={
              <ActionPanel>
                <Action title="重新搜索" onAction={() => setSearchPerformed(false)} />
              </ActionPanel>
            }
          />
        ) : (
          repos.map((repo, index) => (
            <List.Item
              key={index}
              title={repo.name}
              subtitle={repo.path}
              accessories={[{ text: `${repo.remotes.length} remote(s)` }]}
              actions={
                <ActionPanel>
                  {defaultMethod && (
                    <Action
                      key={defaultMethod.value}
                      icon={defaultMethod.icon}
                      title={`${defaultMethod.title}`}
                      onAction={() => tryOpen(defaultMethod, repo.path)}
                    />
                  )}
                  {otherMethods.map((method) => (
                    <Action
                      key={method.value}
                      icon={method.icon}
                      title={`${method.title}`}
                      onAction={() => tryOpen(method, repo.path)}
                    />
                  ))}
                  <Action icon={Icon.RotateAntiClockwise} title="重新搜索" onAction={() => setSearchPerformed(false)} />
                </ActionPanel>
              }
            />
          ))
        )
      }
    ></List>
  );
}
