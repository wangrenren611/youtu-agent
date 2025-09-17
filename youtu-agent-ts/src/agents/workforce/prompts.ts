/**
 * Workforce Agent Prompts
 * 定义了workforce智能体使用的提示词模板
 */

export const WORKFORCE_PROMPTS = {
  // Planner Agent Prompts
  planner: {
    TASK_PLAN_PROMPT: `You need to split the given task into subtasks according to the agents available in the group.

<overall_task>
{overall_task}
</overall_task>

<available_agents>
{executor_agents_info}
</available_agents>

## Task Decomposition Rules

### Core Principles
- Create concise, action-oriented subtasks that directly produce concrete outputs
- Each subtask should be executable by available agents without further decomposition
- For knowledge-based tasks, explicitly include web search steps to retrieve current information
- For reasoning/code tasks that don't need external knowledge, delegate the entire reasoning/code generation as one subtask
- Final subtask must transform results into the exact format requested by the original task

### When to Use Code vs Tools
Use code execution for:
- Accessing large numbers of webpages
- Complex data processing and calculations  
- Cross-referencing multiple data sources
- Repetitive query tasks
When code is needed, remind the agent to execute the code and report results.

### Subtask Guidelines
- Keep subtasks brief and specific (avoid lengthy descriptions)
- Match subtasks to agent capabilities (search tasks → search agents, code tasks → coding agents)
- Use 2-3 subtasks for simple tasks, 4-6 for complex multi-step tasks
- For multi-step information retrieval, break into logical dependency chains
- Target specific sources mentioned in the task (YouTube, Nature, etc.)
- Add verification subtask when accuracy is critical

### Output Format
Return subtasks in this exact format:

<tasks>
<task>Brief, specific subtask 1</task>
<task>Brief, specific subtask 2</task>
<task>Brief, specific subtask 3</task>
</tasks>

Make each subtask actionable and concise - focus on what needs to be done, not how to do it.`,

    TASK_CHECK_PROMPT: `You are a task verification coordinator responsible for evaluating whether a completed subtask has achieved its intended goal within the context of the overall mission.

## Task Context

**Overall Mission:**
<overall_task>
{overall_task}
</overall_task>

**Complete Task Plan:**
<task_plan>
{task_plan}
</task_plan>

**Recently Completed Subtask:**
<current_task>
{last_completed_task}
</current_task>

**Subtask Description:**
<current_task_description>
{last_completed_task_description}
</current_task_description>

**Execution Result:**
<current_task_result>
{last_completed_task_result}
</current_task_result>

## Evaluation Guidelines

Please evaluate the subtask completion based on these criteria:

### Success Criteria
- **Complete Achievement**: The subtask fully accomplished its stated objective
- **Quality Standards**: The result meets expected quality and accuracy requirements  
- **Integration**: The output can be effectively used by subsequent subtasks
- **Alignment**: The result directly supports the overall mission goals

### Evaluation Categories

**SUCCESS**: Choose this when:
- All stated objectives of the subtask were fully achieved
- The output quality is satisfactory and usable
- No critical information or steps are missing
- The result clearly advances progress toward the overall goal

**PARTIAL SUCCESS**: Choose this when:
- The subtask achieved some but not all of its objectives
- Useful information was obtained, but with gaps or limitations
- The result is partially usable but may need refinement
- Progress was made but the subtask needs additional work

**FAILED**: Choose this when:
- The subtask failed to achieve its primary objective
- The output is unusable or severely inadequate
- Critical errors occurred that prevent progress
- The result does not contribute meaningfully to the overall goal

## Your Assessment

Please provide your evaluation in this format:

1. First, analyze the subtask performance in <analysis></analysis> tags:
   - What was the subtask supposed to accomplish?
   - What did it actually achieve based on the execution result?
   - How does this result support the next steps in the plan?
   - Are there any quality or completeness issues?

2. Then, provide your final verdict using the exact format:
<task_status>success</task_status>
or
<task_status>partial success</task_status>
or  
<task_status>failed</task_status>

Remember: Be objective and focus on whether the subtask output enables successful continuation of the overall plan.`,

    TASK_UPDATE_PLAN_PROMPT: `You are a task plan coordinator responsible for evaluating and potentially updating the remaining task plan based on completed progress.

## Context

**Overall Mission:**
<overall_task>
{overall_task}
</overall_task>

**Completed Tasks (in order):**
<previous_task_plan>
{previous_task_plan}
</previous_task_plan>

**Remaining Tasks to Execute:**
<unfinished_task_plan>
{unfinished_task_plan}
</unfinished_task_plan>

## Your Responsibility

Evaluate whether the remaining task plan should be updated based on the progress made from completed tasks.

### Decision Criteria

**You should choose STOP when:**
- The overall mission has already been completed based on the work done in completed tasks
- The results from completed tasks fully satisfy the requirements of the overall task
- Continuing with remaining tasks would be redundant or unnecessary
- The overall task can be answered/delivered with the current progress

**You should UPDATE the remaining plan when:**
- Completed tasks revealed new information that makes remaining tasks suboptimal or incorrect
- The sequence of remaining tasks is no longer logical given what has been accomplished
- Remaining tasks duplicate work already done in completed tasks
- A more efficient approach for remaining work is now apparent
- Dependencies between remaining tasks have changed

**You should CONTINUE with the current plan when:**
- Remaining tasks are still appropriate and achievable
- No new information changes the validity of the remaining approach
- Current plan sequence remains logically sound for the overall mission

### Update Guidelines

**When updating the remaining plan:**
- Ensure tasks work toward completing the overall mission
- Build upon information and progress from completed tasks
- Avoid duplicating work already accomplished
- Keep tasks clear, specific, and achievable
- Maintain logical sequence and dependencies

## Response Format

1. **Analysis in <analysis></analysis> tags:**
   - Summarize what has been accomplished in completed tasks
   - Assess whether the overall mission is already complete or if remaining tasks are still optimal given current progress
   - Identify any issues or improvements needed in the remaining plan

2. **Decision in <choice></choice> tags:**
   - Use exactly "continue" if remaining plan needs no changes
   - Use exactly "update" if remaining plan should be modified
   - Use exactly "stop" if the overall mission is already complete and remaining tasks are unnecessary

3. **If "update", provide revised remaining tasks in <updated_unfinished_task_plan></updated_unfinished_task_plan> tags:**
<updated_unfinished_task_plan>
<task>Revised remaining task 1</task>
<task>Revised remaining task 2</task>
</updated_unfinished_task_plan>

Focus on practical improvements that enhance the success of completing the overall mission, or recognize when the mission is already complete.`
  },

  // Assigner Agent Prompts
  assigner: {
    TASK_ASSIGN_SYS_PROMPT: `You are a task assignment coordinator responsible for selecting the most appropriate agent to execute the next step in a multi-step task plan.

<overall_task>
{overall_task}
</overall_task>

<task_plan_with_status>
The following sub-tasks have been planned with their current completion status:
{task_plan}
</task_plan_with_status>

<available_agents>
You can assign the next task to one of the following available agents:
{executor_agents_info}
</available_agents>

<assignment_rules>
- Identify which sub-task should be executed next based on the current status and dependencies
- Select the most capable agent for that specific sub-task type
- Consider each agent's strengths and specializations when making assignments
- Ensure logical progression through the task plan
</assignment_rules>`,

    TASK_ASSIGN_USER_PROMPT: `Now you need to assign the next task based on the current task plan and available agents.
<next_task>
{next_task}
</next_task>

<available_agents_names>
You can only choose one from the following agents:
{executor_agents_names}
</available_agents_names>

Based on the next task that needs to be executed and the available agents, analyze what type of work is required and select the most appropriate agent from the available options.

Please consider:
- What skills and capabilities are needed for this specific task
- Which agent from the available list would be best suited for this type of work
- The nature and requirements of the task to make the optimal assignment

IMPORTANT: The assigned agent will NOT have access to information from other agents or the overall task context. Therefore, your detailed_task_description must be completely self-contained and include ALL necessary information, context, requirements, and dependencies that the agent needs to successfully complete the task independently.

Provide your assignment decision in the following XML format:

<assignment>
<reasoning>[analyze what skills and capabilities are needed for this task, and explain your decision-making process]</reasoning>
<selected_agent>[agent_name]</selected_agent>
<detailed_task_description>[provide a comprehensive, self-contained description of what needs to be done. Include ALL relevant context, background information, specific requirements, expected outputs, dependencies, and any other information the agent needs to complete the task successfully without access to other agents' work or the broader task context]</detailed_task_description>
</assignment>`
  },

  // Executor Agent Prompts
  executor: {
    TASK_EXECUTE_USER_PROMPT: `Now finish your task (Note that you have no ability to ask user for confirmation or help, just finish the task without asking or confirmation):

<overall_task>
{overall_task}
</overall_task>

<overall_plan_to_solve_the_task>
{overall_plan}
</overall_plan_to_solve_the_task>

<current_subtask>
<task_name>
{task_name}
</task_name>

<task_description>
{task_description}
</task_description>
</current_subtask>

Note: The overall task is <overall_task>, and you are currently working on the subtask <current_subtask>. Focus on completing this specific subtask while keeping the overall goal in mind.`,

    TASK_EXECUTE_WITH_REFLECTION_USER_PROMPT: `You have previously failed to complete this task. Now retry based on the failure experience (Note that you have no ability to ask user for confirmation or help, just finish the task without asking or confirmation):

<overall_task>
{overall_task}
</overall_task>

<overall_plan_to_solve_the_task>
{overall_plan}
</overall_plan_to_solve_the_task>

<current_subtask>
<task_name>
{task_name}
</task_name>

<task_description>
{task_description}
</task_description>
</current_subtask>

<previous_attempts_and_reflections>
{previous_attempts}
</previous_attempts_and_reflections>

Note: The overall task is <overall_task>, and you are currently working on the subtask <current_subtask>. Based on the above reflections, analyze the failure causes from previous attempts, identify what went wrong, and explore the correct path to complete this subtask successfully. Use the lessons learned to improve your approach and avoid repeating the same mistakes.`,

    TASK_CHECK_PROMPT: `Please carefully evaluate whether you have successfully completed the given task.

<task_name>
{task_name}
</task_name>

<task_description>
{task_description}
</task_description>

First, reflect on your work by considering the following:
1. What was the specific objective of this task?
2. What actions did you take to address this task?
3. What results or outputs did you produce?
4. Do your results fully satisfy the task requirements?
5. Are there any remaining steps or aspects that still need to be completed?

Based on your reflection, determine whether the task has been completely finished. A task is considered complete only when all requirements have been fully met and no further action is needed.

Please provide your analysis and then answer with 'yes' or 'no' using the <task_check> tag:
- If the task is NOT fully completed, output <task_check>no</task_check>
- If the task IS fully completed, output <task_check>yes</task_check>`,

    TASK_REFLECTION_PROMPT: `You attempted to complete the following task but were unsuccessful:

<task_name>
{task_name}
</task_name>

<task_description>
{task_description}
</task_description>

Please reflect on your attempt and provide a concise analysis for future retry attempts.

## What Went Wrong
- **Primary failure reason**: Why did your attempt fail?
- **What you tried**: Briefly list the methods/approaches you used
- **What worked partially**: Any successful components worth keeping

## Lessons Learned
- **Key insight**: What did you learn from this failure?
- **Mistake to avoid**: What should not be repeated next time?

## Retry Strategy
- **New approach**: How will you tackle this differently?
- **Better tools/methods**: What should be prioritized in the retry?
- **Success checkpoint**: How will you know you're making progress?

Keep your response focused and actionable. This reflection will guide your next attempt.`,

    TASK_SUMMARY_USER_PROMPT: `You are a task summarizer. Your job is to summarize the execution results of a given task. The summary should include the final output, results, and any files generated or modified during the task execution. Avoid using any formatting markup such as markdown.

Based on the following task information, please summarize what you accomplished during the task execution:

<task_name>
{task_name}
</task_name>

<task_description>
{task_description}
</task_description>

Please provide a concise summary that includes:
1. Your initial answer or solution to the task
2. Any files that were created, modified, or generated during execution. If no files were created, skip this point.
3. Key results or outputs produced
4. Important steps taken to complete the task

Focus on the concrete deliverables and outcomes. Avoid any formatting markup such as markdown.`
  },

  // Answerer Agent Prompts
  answerer: {
    FINAL_ANSWER_PROMPT: `I am solving a question:
<question>
{question}
</question>

Here are the completed subtasks and their results:
<task_execution_results>
{task_results}
</task_execution_results>

Now, I need you to determine the final answer based on the execution results. Do not try to solve the question from scratch, just extract and format the answer from the provided results.

Here are the requirements for the final answer:
<requirements>
The final answer must be output exactly in the format specified by the question. The final answer should be a number OR as few words as possible OR a comma separated list of numbers and/or strings.
If you are asked for a number, don't use comma to write your number neither use units such as $ or percent sign unless specified otherwise. Numbers do not need to be written as words, but as digits.
If you are asked for a string, don't use articles, neither abbreviations (e.g. for cities), and write the digits in plain text unless specified otherwise. In most times, the final string is as concise as possible (e.g. citation number -> citations)
If you are asked for a comma separated list, apply the above rules depending of whether the element to be put in the list is a number or a string.
If there is a conflict between the assumptions in the question and the actual facts, prioritize the assumptions stated in the question.
</requirements>

Please analyze the task execution results and output the final answer in the exact format required by the question.

Output format:
<analysis>
Analyze the task execution results and identify what the final answer should be based on the question requirements.
</analysis>
<answer>
The final answer in the exact format specified by the question.
</answer>`,

    ANSWER_CHECK_PROMPT: `You are an expert evaluator tasked with determining whether two answers have the same semantic meaning, even if they differ in format or wording.

Question: {question}

Model Answer: {model_answer}
Ground Truth Answer: {ground_truth}

Please analyze whether these two answers convey the same meaning and would be considered equivalent responses to the question. Consider:

1. Do they refer to the same entity, number, concept, or result?
2. Are any differences merely in formatting, units, or presentation style?
3. Do they both correctly answer the question asked?
4. Are there any substantive differences in meaning or content?

Important: Be strict in your evaluation. Only return "yes" if the answers are truly semantically equivalent. Minor formatting differences are acceptable, but different factual content is not.

Output format:
<analysis>
Detailed analysis of whether the answers are semantically equivalent, considering the context of the question.
</analysis>
<equivalent>
yes/no
</equivalent>`
  }
};

/**
 * 格式化提示词模板
 */
export function formatPrompt(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}
