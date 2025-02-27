-- Clear existing comments if needed
DELETE FROM comments;

-- Comments for post-1
INSERT INTO comments (post_id, sender_name, sender_email, content, ip) VALUES
('post-1', 'Alice Johnson', 'alice@example.com', 'This post was very insightful! I particularly enjoyed the section about data structures.', '192.168.1.101'),
('post-1', 'Bob Smith', 'bob@example.com', 'I disagree with your conclusion. Have you considered the alternative approach mentioned in the recent paper?', '192.168.1.102'),
('post-1', 'Carol Davis', 'carol@example.com', 'Great article! Would love to see a follow-up on this topic.', '192.168.1.103'),
('post-1', 'David Miller', null, 'Thanks for explaining this complex topic in simple terms.', '192.168.1.104'),
('post-1', 'Emma Wilson', 'emma@example.com', 'I shared this with my team - we were just discussing this yesterday!', '192.168.1.105'),
('post-1', 'Frank Thomas', 'frank@example.com', 'The code examples were very helpful. I implemented them in my project.', '192.168.1.106'),
('post-1', 'Grace Lee', null, 'Could you clarify the part about optimization? I''m not sure I follow.', '192.168.1.107'),
('post-1', 'Henry Garcia', 'henry@example.com', 'I''ve been following your blog for years - this is one of your best posts!', '192.168.1.108'),
('post-1', 'Isabella Chen', 'bella@example.com', 'There''s a typo in the third paragraph. Otherwise, excellent content!', '192.168.1.109'),
('post-1', 'Jack Robinson', 'jack@example.com', 'Looking forward to more content like this in the future.', '192.168.1.110'),
('post-1', 'Alice Johnson', 'alice@example.com', 'This post was very insightful! I particularly enjoyed the section about data structures.', '192.168.1.111'),
('post-1', 'Bob Smith', 'bob@example.com', 'I disagree with your conclusion. Have you considered the alternative approach mentioned in the recent paper?', '192.168.1.112'),
('post-1', 'Carol Davis', 'carol@example.com', 'Great article! Would love to see a follow-up on this topic.', '192.168.1.113'),
('post-1', 'David Miller', null, 'Thanks for explaining this complex topic in simple terms.', '192.168.1.114'),
('post-1', 'Emma Wilson', 'emma@example.com', 'I shared this with my team - we were just discussing this yesterday!', '192.168.1.115'),
('post-1', 'Frank Thomas', 'frank@example.com', 'The code examples were very helpful. I implemented them in my project.', '192.168.1.116'),
('post-1', 'Grace Lee', null, 'Could you clarify the part about optimization? I''m not sure I follow.', '192.168.1.117'),
('post-1', 'Henry Garcia', 'henry@example.com', 'I''ve been following your blog for years - this is one of your best posts!', '192.168.1.118'),
('post-1', 'Isabella Chen', 'bella@example.com', 'There''s a typo in the third paragraph. Otherwise, excellent content!', '192.168.1.119'),
('post-1', 'Jack Robinson', 'jack@example.com', 'Looking forward to more content like this in the future.', '192.168.1.120');

-- Comments for post-2
INSERT INTO comments (post_id, sender_name, sender_email, content, ip) VALUES
('post-2', 'Karen White', 'karen@example.com', 'This changed my perspective on the entire subject. Thank you!', '192.168.1.121'),
('post-2', 'Leo Martinez', 'leo@example.com', 'I''ve been working in this field for 10 years and never thought about it this way.', '192.168.1.122'),
('post-2', 'Mia Johnson', null, 'Can you recommend any resources for further reading on this topic?', '192.168.1.123'),
('post-2', 'Noah Brown', 'noah@example.com', 'The historical context you provided really helped me understand the evolution of this technology.', '192.168.1.124'),
('post-2', 'Olivia Davis', 'olivia@example.com', 'I''m implementing these practices in my current project. Will let you know how it goes!', '192.168.1.125'),
('post-2', 'Peter Wilson', null, 'This is exactly the solution I''ve been looking for. Thanks for sharing!', '192.168.1.126'),
('post-2', 'Quinn Taylor', 'quinn@example.com', 'Your diagrams really helped me visualize the concept.', '192.168.1.127'),
('post-2', 'Ryan Anderson', 'ryan@example.com', 'I have a question about the implementation - is there a way to optimize it further?', '192.168.1.128'),
('post-2', 'Sophia Lee', 'sophia@example.com', 'This was perfectly timed - I was just about to start a similar project.', '192.168.1.129'),
('post-2', 'Thomas Clark', 'thomas@example.com', 'Have you considered the security implications of this approach?', '192.168.1.130');

-- Comments for post-3
INSERT INTO comments (post_id, sender_name, sender_email, content, ip) VALUES
('post-3', 'Uma Patel', 'uma@example.com', 'I''ve tried similar methods before but yours seems much more efficient.', '192.168.1.131'),
('post-3', 'Victor Rodriguez', 'victor@example.com', 'This would be great material for a workshop or tutorial series.', '192.168.1.132'),
('post-3', 'Wendy Miller', null, 'The practical examples really drove home the theoretical concepts.', '192.168.1.133'),
('post-3', 'Xavier Johnson', 'xavier@example.com', 'I''m new to this field and found your explanation very accessible.', '192.168.1.134'),
('post-3', 'Yasmine Kim', 'yasmine@example.com', 'Do you have any thoughts on how this applies to larger scale systems?', '192.168.1.135'),
('post-3', 'Zach Thompson', null, 'I experienced the exact issue you described last week! Your solution works perfectly.', '192.168.1.136'),
('post-3', 'Amy Garcia', 'amy@example.com', 'The performance improvements you mentioned are impressive. Did you benchmark them?', '192.168.1.137'),
('post-3', 'Ben Williams', 'ben@example.com', 'I appreciate you addressing the common misconceptions in this area.', '192.168.1.138'),
('post-3', 'Chloe Martinez', 'chloe@example.com', 'Your writing style makes complex topics enjoyable to read about.', '192.168.1.139'),
('post-3', 'Derek Johnson', 'derek@example.com', 'How long did it take you to develop this approach? The results are remarkable!', '192.168.1.140');